import { describe, expect, it } from "vitest";
import worker from "./index.js";

const ROWS = [
  { id: 1, faculty: "MED", subject: "Anatomi", type: "Ligjerata", teacher: "//", created_at: "2026-01-01" },
  { id: 2, faculty: "MED", subject: "anatomi", type: "Afat", teacher: "//", created_at: "2026-01-02" },
  { id: 3, faculty: "FIEK", subject: "Algoritme", type: "Projekt", teacher: "//", created_at: "2026-01-03" },
];

function makeEnv() {
  const queries = [];
  const db = {
    prepare(sql) {
      let args = [];
      const st = {
        bind: (...a) => ((args = a), st),
        async first() {
          queries.push({ sql, args });
          return { total: 0 };
        },
        async all() {
          if (/SELECT id, faculty, subject, type, teacher, created_at FROM materials WHERE status/.test(sql)) {
            return { results: ROWS };
          }
          queries.push({ sql, args });
          return { results: [] };
        },
        async run() {
          return { meta: { changes: 0 } };
        },
      };
      return st;
    },
  };
  return { env: { DB: db, JWT_SECRET: "x".repeat(40), ENVIRONMENT: "development" }, queries };
}

async function count(query) {
  const { env, queries } = makeEnv();
  const res = await worker.fetch(new Request(`https://api.e-studenti.com/?action=materials&${query}`), env, {
    waitUntil() {},
  });
  expect(res.status).toBe(200);
  return queries.find((q) => /COUNT\(\*\) as total/.test(q.sql));
}

describe("catalogue filters accept lists", () => {
  it("filters by several faculties, levels and types at once", async () => {
    const q = await count("faculty=med,fiek&niveli=bachelor,master&type=Afat,Projekt");
    expect(q.sql).toMatch(/m\.faculty IN \(\?,\?\)/);
    expect(q.sql).toMatch(/study_level, 'bachelor'\) IN \(\?,\?\)/);
    expect(q.sql).toMatch(/m\.type IN \(\?,\?\)/);
    expect(q.args).toEqual(["MED", "FIEK", "bachelor", "master", "Afat", "Projekt"]);
  });

  it("ignores unknown study levels", async () => {
    const q = await count("niveli=bachelor,hacker");
    expect(q.args).toEqual(["bachelor"]);
  });

  it("filters by subject through every stored spelling of it", async () => {
    const q = await count("subjects=anatomi-med");
    expect(q.sql).toMatch(/m\.faculty = \? AND m\.subject IN \(\?,\?\)/);
    expect(q.args[0]).toBe("MED");
    expect(q.args.slice(1).sort()).toEqual(["Anatomi", "anatomi"]);
  });

  it("matches nothing for an unknown subject instead of showing everything", async () => {
    const q = await count("subjects=nuk-ekziston-med");
    expect(q.sql).toMatch(/0 = 1/);
  });
});
