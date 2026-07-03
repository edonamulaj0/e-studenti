import { describe, expect, it } from "vitest";
import {
  buildResourceSearchClause,
  getPublicSubmitterName,
  sanitizeResourceLinkForPublic,
  validateResourceUrlInput,
} from "./resource-links.js";

describe("resource link privacy", () => {
  it("hides anonymous submitter from public payloads", () => {
    const link = {
      id: 1,
      title: "Drive Kursi",
      is_anonymous: 1,
      submitter_name: "Arben Krasniqi",
    };
    const sanitized = sanitizeResourceLinkForPublic(link);
    expect(sanitized.submitter_name).toBeUndefined();
    expect(getPublicSubmitterName(link)).toBe("Anonim");
  });

  it("search clause excludes anonymous names", () => {
    const { clause } = buildResourceSearchClause("Arben");
    expect(clause).toContain("is_anonymous");
  });

  it("rejects invalid URL schemes", () => {
    expect(validateResourceUrlInput("javascript:alert(1)").ok).toBe(false);
  });
});
