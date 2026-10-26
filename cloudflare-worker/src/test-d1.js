import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const MIGRATIONS = new URL("../migrations/", import.meta.url);

/** D1 takes undefined as NULL and booleans as integers; node:sqlite takes neither. */
const value = (v) => (v === undefined ? null : typeof v === "boolean" ? Number(v) : v);

/**
 * A D1-shaped database for tests: real SQLite (what D1 runs on) with every
 * migration in cloudflare-worker/migrations applied, so queries are checked
 * against the real schema instead of a mock that accepts anything.
 */
export function createTestD1() {
  const db = new DatabaseSync(":memory:");
  for (const file of readdirSync(MIGRATIONS).filter((name) => name.endsWith(".sql")).sort()) {
    db.exec(readFileSync(new URL(file, MIGRATIONS), "utf8"));
  }
  const statement = (sql, args = []) => ({
    bind: (...next) => statement(sql, next.map(value)),
    async first() {
      return db.prepare(sql).get(...args) ?? null;
    },
    async all() {
      return { results: db.prepare(sql).all(...args) };
    },
    async run() {
      const result = db.prepare(sql).run(...args);
      return { meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } };
    },
  });
  return {
    raw: db,
    prepare: (sql) => statement(sql),
    async batch(statements) {
      db.exec("BEGIN");
      try {
        const results = [];
        for (const st of statements) results.push(await st.run());
        db.exec("COMMIT");
        return results;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}
