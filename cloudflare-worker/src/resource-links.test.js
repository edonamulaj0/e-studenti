import { describe, expect, it } from "vitest";
import {
  buildResourceSearchClause,
  getPublicSubmitterName,
  isBlockedHostname,
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
      user_id: 9,
    };
    const sanitized = sanitizeResourceLinkForPublic(link);
    expect(sanitized.submitter_name).toBeUndefined();
    expect(sanitized.user_id).toBeUndefined();
    expect(getPublicSubmitterName(link)).toBe("Anonim");
  });

  it("search clause excludes anonymous names", () => {
    const { clause } = buildResourceSearchClause("Arben");
    expect(clause).toContain("is_anonymous");
  });

  it("rejects invalid URL schemes", () => {
    expect(validateResourceUrlInput("javascript:alert(1)").ok).toBe(false);
  });

  it("blocks private and local SSRF targets", () => {
    expect(isBlockedHostname("localhost")).toBe(true);
    expect(isBlockedHostname("127.0.0.1")).toBe(true);
    expect(isBlockedHostname("10.0.0.5")).toBe(true);
    expect(isBlockedHostname("192.168.1.1")).toBe(true);
    expect(isBlockedHostname("169.254.169.254")).toBe(true);
    expect(isBlockedHostname("::1")).toBe(true);
    expect(validateResourceUrlInput("http://127.0.0.1/admin").ok).toBe(false);
    expect(validateResourceUrlInput("https://example.com/path").ok).toBe(true);
  });
});
