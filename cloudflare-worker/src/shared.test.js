// The website and the Worker import the same rules from /shared. These tests pin
// the behaviour that used to drift when each side kept its own copy.
import { describe, expect, it } from "vitest";
import worker from "./index.js";
import { isDisposableEmail as fromApp } from "../../app/lib/disposable-email-domains.js";
import { isDisposableEmail as fromShared, DISPOSABLE_EMAIL_DOMAINS } from "../../shared/email-domains.mjs";
import { FACULTIES, MATERIAL_TYPES } from "../../app/lib/material-options.js";
import { FACULTY_CODES, MATERIAL_TYPES as SHARED_TYPES } from "../../shared/material-options.mjs";
import { assignMaterialSlugs as appSlugs } from "../../app/lib/material-slug.js";
import { assignMaterialSlugs as workerSlugs } from "./material-slug.js";
import { ALLOWED_EXTENSIONS as pageExt } from "../../app/lib/bulk-upload.js";
import { ALLOWED_EXTENSIONS as sharedExt } from "../../shared/upload-limits.mjs";

describe("shared rules", () => {
  it("the form and the Worker use the same disposable-address check", () => {
    expect(fromApp).toBe(fromShared);
    expect(fromShared("someone@fishnone.com")).toBe(true); // was blocked by the form but not the server
    expect(fromShared("someone@gmail.com")).toBe(false);
    expect(DISPOSABLE_EMAIL_DOMAINS.length).toBeGreaterThan(50);
  });

  it("the Worker refuses a disposable address at registration", async () => {
    const response = await worker.fetch(
      new Request("https://api.e-studenti.com/?action=register", {
        method: "POST",
        headers: { Origin: "http://localhost:3000", "Content-Type": "application/json" },
        body: JSON.stringify({ name: "A", surname: "B", email: "x@fishnone.com" }),
      }),
      { DB: { prepare: () => ({ bind() { return this; }, async run() { return { meta: { changes: 1 } }; }, async first() { return null; }, async all() { return { results: [] }; } }) }, ENVIRONMENT: "development", JWT_SECRET: "s".repeat(40) }
    );
    expect(response.status).toBe(400);
  });

  it("the upload form offers exactly the faculties and types the Worker accepts", () => {
    expect(FACULTIES.map((f) => f.code)).toEqual(FACULTY_CODES);
    expect(MATERIAL_TYPES).toEqual(SHARED_TYPES);
  });

  it("the page and the Worker share one extension list", () => {
    expect(pageExt).toBe(sharedExt);
  });

  it("slugs are computed identically on both sides", () => {
    const rows = [
      { id: 1, title: "Provimi", faculty: "FIEK" },
      { id: 2, title: "Provimi", faculty: "FIEK" },
      { id: 3, title: "Ë Çmim", faculty: "MED" },
    ];
    expect(appSlugs(rows)).toEqual(workerSlugs(rows));
    expect(workerSlugs(rows).map((r) => r.slug)).toEqual(["provimi-fiek-1", "provimi-fiek-2", "e-cmim-med"]);
  });
});
