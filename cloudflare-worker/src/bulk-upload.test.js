// Tests the browser-side bulk upload logic (app/lib/bulk-upload.js). It is pure,
// and the Worker package is where the project's test runner lives.
import { describe, expect, it } from "vitest";
import {
  IN_FLIGHT_BYTE_BUDGET,
  UPLOAD_CONCURRENCY,
  buildFormData,
  chunk,
  effectiveFields,
  findBatchDuplicates,
  inferMetadata,
  suggestType,
  planUploads,
  sha256Hex,
  summarize,
  validateRow,
} from "../../app/lib/bulk-upload.js";

const MB = 1024 * 1024;
const file = (name, size = 1000) => ({ name, size });
const defaults = {
  faculty: "MED", department: "", subject: "Anatomi", teacher: "", type: "", study_level: "bachelor", is_anonymous: false,
};
const row = (over = {}) => ({
  id: "r1", status: "ready", file: file("a.pdf"), inferred: { title: "A", type: null }, overrides: {}, ...over,
});

describe("suggestType", () => {
  // Titles and stored file names of real materials that were filed as "Të tjera".
  it("files notes, course slides and exams", () => {
    expect(suggestType({ title: "Elektronika - Shënime" })).toBe("Shënime");
    expect(suggestType({ title: "Automatikë - Teori (Skriptë)" })).toBe("Shënime");
    expect(suggestType({ title: "Përmbledhje pyetjesh nga Mjekësia Interne" })).toBe("Shënime");
    expect(suggestType({ title: "Semestri 5 - Analize e algoritmeve - materiale kursi - 3" })).toBe("Ligjerata");
    expect(suggestType({ title: "Kolokfiumi i parë" })).toBe("Afat");
  });

  it("falls back to the stored file name", () => {
    expect(
      suggestType({ title: "Instrumente Endodontike", r2_url: "https://media.e-studenti.com/materials/1778525321674-Shenime-JM.pdf" })
    ).toBe("Shënime");
  });

  it("does not guess when nothing says which type it is", () => {
    expect(suggestType({ title: "Fundamentals of Pathology", r2_url: "https://media.e-studenti.com/x/PATHOMA.pdf" })).toBeNull();
    expect(suggestType({ title: "Orari i përhershëm i provimeve" })).toBeNull();
  });
});

describe("inferMetadata", () => {
  it("turns a file name into a readable title", () => {
    expect(inferMetadata("Anatomia_Ligjerata_3.pdf").title).toBe("Anatomia Ligjerata 3");
    expect(inferMetadata("provimi-pranues-2024 (1).pdf").title).toBe("provimi - pranues - 2024");
    expect(inferMetadata("<script>.pdf").title).toBe("script");
  });

  it("guesses a type from keywords, folding accents", () => {
    expect(inferMetadata("Stomatologji provim pranues 2024.pdf").type).toBe("Provime Pranuese");
    expect(inferMetadata("Afati i qershorit.docx").type).toBe("Afat");
    expect(inferMetadata("Projekti final.pdf").type).toBe("Projekt");
    expect(inferMetadata("Libri i matematikës.pdf").type).toBe("Libër");
    expect(inferMetadata("Slajde java 1.pptx").type).toBe("Ligjerata");
    expect(inferMetadata("shenime.pdf").type).toBe("Shënime");
  });
});

describe("effectiveFields", () => {
  it("lets a row's own edits beat the shared defaults", () => {
    const fields = effectiveFields(row({ overrides: { subject: "Fiziologji" } }), defaults);
    expect(fields.subject).toBe("Fiziologji");
    expect(fields.faculty).toBe("MED");
  });

  it("uses the guessed type unless the batch type is locked", () => {
    const r = row({ inferred: { title: "A", type: "Afat" } });
    expect(effectiveFields(r, { ...defaults, type: "Projekt" }).type).toBe("Afat");
    expect(effectiveFields(r, { ...defaults, type: "Projekt", typeLocked: true }).type).toBe("Projekt");
  });

  it("blanks department, subject and teacher for entrance exams", () => {
    const f = effectiveFields(row({ overrides: { type: "Provime Pranuese" } }), defaults);
    expect([f.department, f.subject, f.teacher]).toEqual(["//", "//", "//"]);
  });
});

describe("validateRow", () => {
  const ok = { ...defaults, type: "Afat" };

  it("accepts a complete row", () => {
    expect(validateRow(row(), ok)).toEqual({});
  });

  it("reports each missing or invalid field", () => {
    const errors = validateRow(
      row({ file: file("x.exe"), inferred: { title: "<b>", type: null }, overrides: { subject: "" } }),
      { ...defaults, faculty: "", type: "" }
    );
    expect(Object.keys(errors).sort()).toEqual(["faculty", "file", "subject", "title", "type"]);
  });

  it("rejects empty and oversized files", () => {
    expect(validateRow(row({ file: file("a.pdf", 0) }), ok).file).toMatch(/bosh/);
    expect(validateRow(row({ file: file("a.pdf", 51 * MB) }), ok).file).toMatch(/50MB/);
  });

  it("does not require a subject for entrance exams", () => {
    const errors = validateRow(row({ overrides: { type: "Provime Pranuese", subject: "" } }), ok);
    expect(errors.subject).toBeUndefined();
  });
});

describe("buildFormData", () => {
  it("builds the fields the Worker expects", () => {
    const f = new File([new Uint8Array(10)], "a.pdf");
    const form = buildFormData(row({ file: f }), { ...defaults, type: "Afat", is_anonymous: true }, "ab".repeat(32));
    expect(form.get("title")).toBe("A");
    expect(form.get("department")).toBe("//");
    expect(form.get("teacher")).toBe("//");
    expect(form.get("is_anonymous")).toBe("1");
    expect(form.get("content_hash")).toBe("ab".repeat(32));
    expect(form.get("file").name).toBe("a.pdf");
  });
});

describe("planUploads", () => {
  const queued = (id, size) => ({ id, status: "queued", file: file(`${id}.pdf`, size) });

  it("starts at most the concurrency limit", () => {
    const rows = ["a", "b", "c", "d"].map((id) => queued(id, MB));
    expect(planUploads(rows)).toEqual(["a", "b"]);
    expect(UPLOAD_CONCURRENCY).toBe(2);
  });

  it("counts uploads already running", () => {
    const rows = [{ id: "x", status: "uploading", file: file("x.pdf", MB) }, queued("a", MB), queued("b", MB)];
    expect(planUploads(rows)).toEqual(["a"]);
  });

  it("holds back a file that would push bytes in flight over the budget", () => {
    const rows = [queued("big1", 40 * MB), queued("big2", 40 * MB), queued("small", MB)];
    // big2 would exceed the budget alongside big1, so the small one goes instead.
    expect(planUploads(rows)).toEqual(["big1", "small"]);
    expect(IN_FLIGHT_BYTE_BUDGET).toBe(64 * MB);
  });

  it("still sends a lone file bigger than the budget", () => {
    expect(planUploads([queued("huge", 70 * MB)])).toEqual(["huge"]);
  });

  it("starts nothing while paused", () => {
    expect(planUploads([queued("a", MB)], { paused: true })).toEqual([]);
  });

  it("ignores rows that are not queued", () => {
    const rows = [{ id: "f", status: "failed", file: file("f.pdf") }, { id: "d", status: "done", file: file("d.pdf") }];
    expect(planUploads(rows)).toEqual([]);
  });
});

describe("helpers", () => {
  it("summarizes by status", () => {
    const s = summarize([{ status: "done" }, { status: "done" }, { status: "failed" }, { status: "queued" }, { status: "skipped" }]);
    expect(s).toMatchObject({ done: 2, failed: 1, queued: 1, skipped: 1, total: 5, finished: 3, active: 1 });
  });

  it("finds duplicates inside a batch", () => {
    const dup = findBatchDuplicates([{ id: "a", hash: "h1" }, { id: "b", hash: "h2" }, { id: "c", hash: "h1" }, { id: "d" }]);
    expect([...dup]).toEqual([["c", "a"]]);
  });

  it("chunks lists", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("hashes file content with SHA-256", async () => {
    const f = new File([new TextEncoder().encode("abc")], "a.txt");
    expect(await sha256Hex(f)).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});
