import { describe, expect, it } from "vitest";
import {
  groupSubjects,
  isRealSubject,
  normalizeSubjectName,
  subjectKey,
  subjectSlug,
  typeRank,
} from "../../shared/subjects.mjs";

describe("subject identity", () => {
  it("ignores case, accents, spacing and punctuation", () => {
    const spellings = ["Anatomi", "anatomi", "  ANATOMI ", "Anatomí", "anatomi."];
    expect(new Set(spellings.map(subjectKey)).size).toBe(1);
    expect(subjectKey("Algoritme dhe Struktura e të Dhënave")).toBe("algoritme-dhe-struktura-e-te-dhenave");
  });

  it("keeps different subjects apart", () => {
    expect(subjectKey("Anatomi 1")).not.toBe(subjectKey("Anatomi 2"));
  });

  it("builds the page slug from subject and faculty", () => {
    expect(subjectSlug("MED", "Anatomi")).toBe("anatomi-med");
    expect(subjectSlug("fiek", "Algoritme")).toBe("algoritme-fiek");
  });

  it("treats empty and the entrance-exam marker as no subject", () => {
    expect(isRealSubject("//")).toBe(false);
    expect(isRealSubject("  ")).toBe(false);
    expect(isRealSubject("Fizikë")).toBe(true);
    expect(normalizeSubjectName("  Fizikë   e   përgjithshme ")).toBe("Fizikë e përgjithshme");
  });
});

describe("groupSubjects", () => {
  const rows = [
    { id: 1, faculty: "MED", subject: "Anatomi", type: "Ligjerata", teacher: "Prof. A" },
    { id: 2, faculty: "MED", subject: "anatomi", type: "Afat", teacher: "//" },
    { id: 3, faculty: "MED", subject: "Anatomi", type: "Afat", teacher: "Prof. A" },
    { id: 4, faculty: "FIEK", subject: "Anatomi", type: "Projekt", teacher: "Prof. B" },
    { id: 5, faculty: "MED", subject: "//", type: "Provime Pranuese" },
    { id: 6, faculty: "MED", subject: "Fiziologji", type: "Ligjerata" },
  ];
  const groups = groupSubjects(rows);

  it("merges spelling variants within a faculty and counts them", () => {
    const anatomi = groups.find((g) => g.slug === "anatomi-med");
    expect(anatomi.count).toBe(3);
    expect(anatomi.ids).toEqual([1, 2, 3]);
    expect(anatomi.types).toEqual({ Ligjerata: 1, Afat: 2 });
    expect(anatomi.variants).toEqual([
      { name: "Anatomi", count: 2 },
      { name: "anatomi", count: 1 },
    ]);
    expect(anatomi.name).toBe("Anatomi");
  });

  it("does not merge across faculties", () => {
    expect(groups.find((g) => g.slug === "anatomi-fiek").count).toBe(1);
  });

  it("leaves out entrance-exam materials and collects teachers", () => {
    expect(groups.some((g) => g.name === "//")).toBe(false);
    expect(groups.find((g) => g.slug === "anatomi-med").teachers).toEqual(["Prof. A"]);
  });

  it("lists the biggest subjects first", () => {
    expect(groups[0].slug).toBe("anatomi-med");
  });

  it("prefers the properly capitalised spelling when counts tie", () => {
    const [group] = groupSubjects([
      { faculty: "MED", subject: "fizika" },
      { faculty: "MED", subject: "Fizika" },
    ]);
    expect(group.name).toBe("Fizika");
  });
});

describe("type order", () => {
  it("puts exams first", () => {
    expect(typeRank("Afat")).toBeLessThan(typeRank("Ligjerata"));
    expect(typeRank("Ligjerata")).toBeLessThan(typeRank("Libër"));
    expect(typeRank("e panjohur")).toBe(7);
  });
});
