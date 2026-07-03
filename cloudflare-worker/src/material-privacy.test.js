import { describe, expect, it } from "vitest";
import {
  ANONYMOUS_DISPLAY_NAME,
  buildPublicSearchClause,
  getPublicUploaderName,
  materialMatchesPublic,
  materialToPublicLegacyEntry,
  sanitizeMaterialForPublic,
} from "./material-privacy.js";

describe("anonymous poster privacy", () => {
  const anonymousMaterial = {
    id: 1,
    title: "Algjebra Lineare",
    faculty: "FIEK",
    subject: "Matematikë",
    teacher: "Prof. X",
    type: "Ligjerata",
    uploader_name: "Arben Krasniqi",
    is_anonymous: 1,
  };

  const publicMaterial = {
    ...anonymousMaterial,
    id: 2,
    is_anonymous: 0,
  };

  it("returns Anonim for anonymous materials", () => {
    expect(getPublicUploaderName(anonymousMaterial)).toBe(ANONYMOUS_DISPLAY_NAME);
  });

  it("strips real uploader_name from public API payloads", () => {
    const sanitized = sanitizeMaterialForPublic(anonymousMaterial);
    expect(sanitized.uploader_name).toBeUndefined();
    expect(sanitized.is_anonymous).toBe(1);
  });

  it("legacy entry shows Anonim, not the real name", () => {
    const entry = materialToPublicLegacyEntry(anonymousMaterial, (name) => name);
    expect(entry.submittedBy.name).toBe(ANONYMOUS_DISPLAY_NAME);
    expect(entry.submittedBy.name).not.toContain("Arben");
  });

  it("does not match anonymous materials by poster name", () => {
    expect(materialMatchesPublic(anonymousMaterial, { q: "Arben" })).toBe(false);
    expect(materialMatchesPublic(anonymousMaterial, { q: "Krasniqi" })).toBe(false);
    expect(materialMatchesPublic(anonymousMaterial, { q: "Algjebra" })).toBe(true);
  });

  it("still matches non-anonymous materials by poster name", () => {
    expect(materialMatchesPublic(publicMaterial, { q: "Arben" })).toBe(true);
  });

  it("search SQL excludes anonymous poster names", () => {
    const { clause, params } = buildPublicSearchClause("Arben");
    expect(clause).toContain("is_anonymous");
    expect(clause).toContain("u.name LIKE ?");
    expect(params).toHaveLength(5);
  });
});
