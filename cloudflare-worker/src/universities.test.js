import { describe, expect, it } from "vitest";
import { DEFAULT_UNIVERSITY, FACULTIES, FIELDS, facultiesFor } from "../../shared/material-options.mjs";
import { UNIVERSITIES } from "../../shared/universities.mjs";
import { isValidPlacement, universityTag } from "../../shared/placement.mjs";
import { groupSubjects, subjectSlug } from "../../shared/subjects.mjs";

const UBT = "kolegji-ubt";

describe("where a material belongs", () => {
  it("the default university is in the generated list", () => {
    expect(UNIVERSITIES.map((u) => u.slug)).toContain(DEFAULT_UNIVERSITY);
    expect(UNIVERSITIES.length).toBeGreaterThan(20);
  });

  it("UP takes its faculties and every other university takes a study field", () => {
    expect(facultiesFor(DEFAULT_UNIVERSITY)).toBe(FACULTIES);
    expect(facultiesFor(UBT)).toBe(FIELDS);
    expect(isValidPlacement(DEFAULT_UNIVERSITY, "MED")).toBe(true);
    expect(isValidPlacement(DEFAULT_UNIVERSITY, "BIZ")).toBe(false);
    expect(isValidPlacement(UBT, "BIZ")).toBe(true);
    expect(isValidPlacement(UBT, "MED")).toBe(false);
  });

  it("rejects an unknown university", () => {
    expect(isValidPlacement("not-a-university", "BIZ")).toBe(false);
  });

  it("field codes cannot collide with faculty codes", () => {
    const codes = [...FACULTIES, ...FIELDS].map((f) => f.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("subjects at different universities", () => {
  it("keep the old slug for UP and add a tag elsewhere", () => {
    expect(subjectSlug("MED", "Anatomi")).toBe("anatomi-med");
    expect(subjectSlug("MED", "Anatomi", DEFAULT_UNIVERSITY)).toBe("anatomi-med");
    expect(universityTag(UBT)).toBe("ubt");
    expect(subjectSlug("INF", "Algoritme", UBT)).toBe("algoritme-inf-ubt");
  });

  it("are not merged across universities", () => {
    const groups = groupSubjects([
      { id: 1, university: "kolegji-ubt", faculty: "INF", subject: "Algoritme" },
      { id: 2, university: "kolegji-aab", faculty: "INF", subject: "Algoritme" },
      { id: 3, faculty: "FIEK", subject: "Algoritme" },
    ]);
    expect(groups.map((g) => g.slug).sort()).toEqual(["algoritme-fiek", "algoritme-inf-aab", "algoritme-inf-ubt"]);
  });
});
