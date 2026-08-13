import { describe, expect, it } from "vitest";
import worker from "./index.js";

/**
 * The public catalog must list every material: RAR archives (offered as
 * download only) and rows still waiting for their uploader to claim them.
 * These tests assert on the SQL the catalog builds, since that is where the
 * filtering used to live.
 */
const ROWS = [
  {
    id: 1,
    title: "Kapitulli 4",
    faculty: "FIEK",
    subject: "Arkitektura",
    type: "Ligjerata",
    file_type: "pdf",
    r2_url: "https://media.e-studenti.com/ch4.pdf",
    is_anonymous: 0,
    uploader_name: "Eriona Ahmeti",
  },
  {
    id: 2,
    title: "Literatura - Elektronikë (RAR)",
    faculty: "FIEK",
    subject: "Elektronika",
    type: "Ligjerata",
    file_type: "rar",
    r2_url: "https://media.e-studenti.com/elektronika.rar",
    is_anonymous: 0,
    uploader_name: "Edona Mulaj",
  },
  {
    id: 3,
    title: "Material i pareklamuar",
    faculty: "MED",
    subject: "Anatomia",
    type: "Afat",
    file_type: "pdf",
    r2_url: "https://media.e-studenti.com/anatomia.pdf",
    is_anonymous: 0,
    // LEFT JOIN against a missing user yields an empty uploader name.
    uploader_name: "",
  },
];

function makeEnv() {
  const sql = [];
  const db = {
    prepare(statementSql) {
      sql.push(statementSql);
      const statement = {
        bind: () => statement,
        async first() {
          if (/COUNT\(\*\) as total/.test(statementSql)) return { total: ROWS.length };
          return null;
        },
        async all() {
          if (/LIMIT \? OFFSET \?/.test(statementSql)) return { results: ROWS };
          if (/GROUP BY m\.type/.test(statementSql)) {
            return { results: [{ type: "Ligjerata", count: 2 }, { type: "Afat", count: 1 }] };
          }
          return { results: [] };
        },
      };
      return statement;
    },
  };
  return { env: { DB: db, ENVIRONMENT: "development" }, sql };
}

async function catalog(query = "") {
  const { env, sql } = makeEnv();
  const response = await worker.fetch(
    new Request(`https://api.e-studenti.com/?action=materials${query}`, {
      headers: { Origin: "https://e-studenti.com" },
    }),
    env
  );
  return { response, body: await response.json(), sql };
}

describe("public catalog visibility", () => {
  it("does not filter out RAR archives", async () => {
    const { response, sql, body } = await catalog();

    expect(response.status).toBe(200);
    for (const statement of sql) {
      expect(statement).not.toMatch(/'rar'/);
    }
    expect(body.entries.map((entry) => entry.fileType)).toContain("rar");
  });

  it("keeps materials whose uploader has not claimed them", async () => {
    const { sql, body } = await catalog();
    const listing = sql.find((statement) => /LIMIT \? OFFSET \?/.test(statement));

    expect(listing).toMatch(/LEFT JOIN users/);
    expect(listing).not.toMatch(/[^T] JOIN users/);
    const unclaimed = body.entries.find((entry) => entry.id === 3);
    expect(unclaimed).toBeDefined();
    expect(unclaimed.submittedBy).toBeUndefined();
  });

  it("omits the WHERE clause entirely when no filter is active", async () => {
    const { sql } = await catalog();
    const listing = sql.find((statement) => /LIMIT \? OFFSET \?/.test(statement));

    expect(listing).not.toMatch(/WHERE/);
  });

  it("still applies requested filters", async () => {
    const { sql } = await catalog("&faculty=med&niveli=master");
    const listing = sql.find((statement) => /LIMIT \? OFFSET \?/.test(statement));

    expect(listing).toMatch(/WHERE m\.faculty = \?/);
    expect(listing).toMatch(/study_level/);
  });
});
