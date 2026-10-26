import { describe, expect, it } from "vitest";
import worker from "./index.js";
import { MODERATOR_EMAIL } from "./moderators.js";

const JWT_SECRET = "test-secret-test-secret-test-secret";
const enc = new TextEncoder();
const b64 = (bytes) =>
  Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function token() {
  const now = Math.floor(Date.now() / 1000);
  const data = `${b64(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })))}.${b64(
    enc.encode(JSON.stringify({ sub: 1, iat: now, exp: now + 3600, iss: "https://e-studenti.com", aud: "https://e-studenti.com", tv: 0 }))
  )}`;
  const key = await crypto.subtle.importKey("raw", enc.encode(JWT_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return `${data}.${b64(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data))))}`;
}

function makeEnv({ email = MODERATOR_EMAIL } = {}) {
  const batches = [];
  const db = {
    prepare(sql) {
      let args = [];
      const st = {
        sql,
        bind: (...a) => ((args = a), (st.args = a), st),
        async run() {
          return { meta: { changes: 1 } };
        },
        async first() {
          if (/FROM users WHERE id/.test(sql)) {
            return { id: 1, email, name: "M", token_version: 0, is_moderator: 0 };
          }
          return null;
        },
        async all() {
          return { results: [] };
        },
      };
      return st;
    },
    async batch(statements) {
      batches.push(statements.map((st) => ({ sql: st.sql, args: st.args })));
      return statements.map(() => ({ meta: { changes: 1 } }));
    },
  };
  return { batches, env: { DB: db, ENVIRONMENT: "development", JWT_SECRET } };
}

async function retype(env, body, method = "POST") {
  return worker.fetch(
    new Request("https://api.e-studenti.com/?action=retype-materials", {
      method,
      headers: { Origin: "http://localhost:3000", Cookie: `srh_token=${await token()}`, "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(body) : undefined,
    }),
    env
  );
}

describe("bulk retype", () => {
  it("applies every change together", async () => {
    const { env, batches } = makeEnv();
    const response = await retype(env, {
      changes: [
        { id: 4, type: "Shënime" },
        { id: 9, type: "Libër" },
      ],
    });
    expect(response.status).toBe(200);
    expect((await response.json()).updated).toBe(2);
    expect(batches).toHaveLength(1);
    expect(batches[0].map((st) => st.args)).toEqual([
      ["Shënime", 4],
      ["Libër", 9],
    ]);
  });

  it("is for the moderator only", async () => {
    const { env, batches } = makeEnv({ email: "student@gmail.com" });
    expect((await retype(env, { changes: [{ id: 4, type: "Shënime" }] })).status).toBe(401);
    expect(batches).toHaveLength(0);
  });

  it("applies nothing when one change is invalid", async () => {
    const { env, batches } = makeEnv();
    const bad = [
      { changes: [{ id: 4, type: "Shënime" }, { id: 5, type: "Gazetë" }] },
      { changes: [{ id: 4, type: "Shënime" }, { id: 4, type: "Libër" }] },
      { changes: [{ id: "x", type: "Shënime" }] },
      { changes: [] },
      { changes: Array.from({ length: 101 }, (_, i) => ({ id: i + 1, type: "Afat" })) },
    ];
    for (const body of bad) expect((await retype(env, body)).status).toBe(400);
    expect(batches).toHaveLength(0);
  });

  it("refuses GET", async () => {
    const { env } = makeEnv();
    expect((await retype(env, null, "GET")).status).toBe(405);
  });
});
