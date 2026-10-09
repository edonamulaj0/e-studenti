import { describe, expect, it } from "vitest";
import worker from "./index.js";

/**
 * Two materials share a title and faculty, so both need an "-id" suffix. The
 * slug has to be computed over the whole catalogue: a listing page that holds
 * only one of them must still return the suffixed slug.
 */
const ALL = [
  { id: 1, title: "Provimi", faculty: "FIEK" },
  { id: 2, title: "Provimi", faculty: "FIEK" },
  { id: 3, title: "Unik", faculty: "MED" },
];

function makeEnv(pageRows) {
  const db = {
    prepare(sql) {
      const statement = {
        bind: () => statement,
        async first() {
          return { total: ALL.length };
        },
        async all() {
          if (/LIMIT \? OFFSET \?/.test(sql)) return { results: pageRows };
          if (/SELECT id, title, faculty FROM materials/.test(sql)) return { results: ALL };
          return { results: [] };
        },
      };
      return statement;
    },
  };
  return { DB: db, ENVIRONMENT: "development" };
}

async function list(pageRows) {
  const response = await worker.fetch(
    new Request("https://api.e-studenti.com/?action=materials&limit=1", {
      headers: { Origin: "https://e-studenti.com" },
    }),
    makeEnv(pageRows)
  );
  return response.json();
}

describe("catalog slugs", () => {
  it("returns catalogue-wide slugs even when the page holds one of the colliding rows", async () => {
    const body = await list([{ ...ALL[0], subject: "x", type: "Afat", file_type: "pdf" }]);
    expect(body.materials[0].slug).toBe("provimi-fiek-1");
    expect(body.entries[0].slug).toBe("provimi-fiek-1");
  });

  it("leaves unique titles unsuffixed", async () => {
    const body = await list([{ ...ALL[2], subject: "x", type: "Afat", file_type: "pdf" }]);
    expect(body.materials[0].slug).toBe("unik-med");
  });
});
