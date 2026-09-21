import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const MIGRATIONS = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

/**
 * A D1-shaped adapter over a real in-memory SQLite database, with the project's
 * own migrations applied in order.
 *
 * Worth the machinery over a hand-written mock. A mock has to encode what each
 * query means, which makes it blind to exactly the bugs that matter most: a
 * mock that matches `WHERE object_key = ? AND user_id = ?` by checking both
 * fields will keep checking both after the `user_id` clause is deleted from the
 * SQL, so the test that is supposed to prove one user cannot commit another's
 * upload proves nothing. Here the SQL runs, so ownership scoping, UNIQUE
 * constraints and the rate limiter's conditional upsert are all real.
 *
 * Test-only: nothing under src/ imports it, so it never reaches the bundle.
 */
export function createTestD1() {
  const db = new DatabaseSync(":memory:");
  for (const file of readdirSync(MIGRATIONS).sort()) {
    if (file.endsWith(".sql")) db.exec(readFileSync(join(MIGRATIONS, file), "utf8"));
  }

  // node:sqlite accepts null but not undefined, and has no boolean type.
  const toSqlite = (value) => {
    if (value === undefined) return null;
    if (typeof value === "boolean") return value ? 1 : 0;
    return value;
  };

  return {
    /** Escape hatch for arranging fixtures and asserting on stored rows. */
    exec: (sql) => db.exec(sql),
    query: (sql, ...params) => db.prepare(sql).all(...params.map(toSqlite)),

    prepare(sql) {
      let bound = [];
      const statement = {
        bind(...args) {
          bound = args.map(toSqlite);
          return statement;
        },
        async run() {
          const result = db.prepare(sql).run(...bound);
          return {
            meta: {
              changes: result.changes,
              last_row_id: Number(result.lastInsertRowid),
            },
          };
        },
        async first() {
          return db.prepare(sql).get(...bound) ?? null;
        },
        async all() {
          return { results: db.prepare(sql).all(...bound) };
        },
      };
      return statement;
    },
  };
}

/** An in-memory stand-in for an R2 bucket binding. */
export function createTestBucket() {
  const store = new Map();
  return {
    store,
    async put(key, value) {
      const bytes =
        value instanceof Uint8Array
          ? value
          : new Uint8Array(await new Response(value).arrayBuffer());
      store.set(key, bytes);
      return {};
    },
    async head(key) {
      const value = store.get(key);
      return value ? { size: value.length } : null;
    },
    async get(key, options) {
      const value = store.get(key);
      if (!value) return null;
      const slice = options?.range
        ? value.slice(options.range.offset, options.range.offset + options.range.length)
        : value;
      return {
        body: new Blob([slice]).stream(),
        async arrayBuffer() {
          return slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
        },
      };
    },
    async delete(key) {
      store.delete(key);
    },
  };
}
