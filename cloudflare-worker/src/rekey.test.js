import { describe, expect, it } from "vitest";
import worker from "./index.js";

const JWT_SECRET = "test-secret-test-secret-test-secret";
const encoder = new TextEncoder();

function b64(bytes) {
  return Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function token() {
  const now = Math.floor(Date.now() / 1000);
  const data = `${b64(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })))}.${b64(
    encoder.encode(
      JSON.stringify({
        sub: 1,
        iat: now,
        exp: now + 3600,
        iss: "https://e-studenti.com",
        aud: "https://e-studenti.com",
        tv: 0,
      })
    )
  )}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return `${data}.${b64(new Uint8Array(sig))}`;
}

function makeEnv({ moderator, rows, missing = [], rowChanged = false }) {
  const updates = [];
  const store = new Map(rows.map((r) => [r.file_key, new Uint8Array([1, 2, 3])]));
  const deleted = [];
  const db = {
    prepare(sql) {
      let args = [];
      const statement = {
        bind: (...a) => {
          args = a;
          return statement;
        },
        async run() {
          if (/UPDATE materials SET file_key/.test(sql)) {
            updates.push(args);
            return { meta: { changes: rowChanged ? 0 : 1 } };
          }
          return { meta: { changes: 1 } };
        },
        async first() {
          if (/FROM users WHERE id/.test(sql)) {
            return { id: 1, email: "m@example.com", name: "M", token_version: 0, is_moderator: moderator ? 1 : 0 };
          }
          return null;
        },
        async all() {
          if (/GLOB/.test(sql)) return { results: rows };
          return { results: [] };
        },
      };
      return statement;
    },
  };
  return {
    updates,
    store,
    deleted,
    env: {
      DB: db,
      MY_BUCKET: {
        async get(key) {
          if (missing.includes(key) || !store.has(key)) return null;
          return { body: store.get(key), httpMetadata: { contentType: "application/pdf" } };
        },
        async put(key, body) {
          store.set(key, body);
        },
        async delete(key) {
          deleted.push(key);
          store.delete(key);
        },
      },
      ENVIRONMENT: "development",
      JWT_SECRET,
    },
  };
}

async function rekey(env, body = {}) {
  return worker.fetch(
    new Request("https://api.e-studenti.com/?action=rekey-materials", {
      method: "POST",
      headers: {
        Origin: "https://e-studenti.com",
        Cookie: `srh_token=${await token()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }),
    env
  );
}

const ROWS = [
  { id: 4, file_key: "materials/12/1700-ab12cd34-notat.pdf" },
  { id: 9, file_key: "materials/12/1701-ffffffff-provimi.pdf" },
];

describe("rekey-materials", () => {
  it("is refused for non-moderators", async () => {
    const { env, updates } = makeEnv({ moderator: false, rows: ROWS });
    const response = await rekey(env);
    expect(response.status).toBe(401);
    expect(updates).toHaveLength(0);
  });

  it("moves legacy objects to opaque keys and deletes the originals", async () => {
    const { env, updates, store, deleted } = makeEnv({ moderator: true, rows: ROWS });
    const body = await (await rekey(env)).json();

    expect(body.migrated).toEqual([4, 9]);
    expect(body.done).toBe(true);
    expect(updates).toHaveLength(2);
    for (const [newKey, newUrl, , oldKey] of updates) {
      expect(newKey).toMatch(/^materials\/[0-9a-f-]{36}\/[^/]+\.pdf$/);
      expect(newKey).not.toMatch(/materials\/12\//);
      expect(newUrl).toBe(`https://media.e-studenti.com/${newKey}`);
      expect(store.has(newKey)).toBe(true);
      expect(deleted).toContain(oldKey);
    }
  });

  it("leaves rows whose object is missing alone and reports them", async () => {
    const { env, updates } = makeEnv({
      moderator: true,
      rows: ROWS,
      missing: [ROWS[0].file_key],
    });
    const body = await (await rekey(env)).json();

    expect(body.skipped).toEqual([{ id: 4, reason: "missing_object" }]);
    expect(body.migrated).toEqual([9]);
    expect(updates).toHaveLength(1);
  });

  it("removes the new copy when the row changed in the meantime", async () => {
    const { env, deleted, store } = makeEnv({ moderator: true, rows: [ROWS[0]], rowChanged: true });
    const body = await (await rekey(env)).json();

    expect(body.migrated).toEqual([]);
    expect(body.skipped[0].reason).toBe("row_changed");
    expect(deleted.some((k) => !k.includes("/12/"))).toBe(true);
    expect(store.has(ROWS[0].file_key)).toBe(true);
  });
});
