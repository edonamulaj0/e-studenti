import { describe, expect, it } from "vitest";
import worker from "./index.js";

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

function makeEnv({ email = "student@example.com", messages = [] } = {}) {
  const log = { batches: [], deletedKeys: [], queries: [], deletedMessages: [] };
  const db = {
    prepare(sql) {
      let args = [];
      const st = {
        sql,
        get args() {
          return args;
        },
        bind: (...a) => ((args = a), st),
        async run() {
          if (/DELETE FROM contact_messages/.test(sql)) {
            log.deletedMessages.push(args[0]);
            return { meta: { changes: args[0] === 5 ? 1 : 0 } };
          }
          return { meta: { changes: 1 } };
        },
        async first() {
          if (/FROM users WHERE id/.test(sql)) {
            return { id: 1, email, name: "Ana", surname: "Beri", created_at: "2026-01-01", token_version: 0, is_moderator: 0 };
          }
          if (/COUNT\(\*\) AS total FROM contact_messages/.test(sql)) return { total: messages.length };
          return null;
        },
        async all() {
          log.queries.push({ sql, args });
          if (/FROM contact_messages/.test(sql)) return { results: messages };
          if (/FROM materials WHERE user_id = \? AND status != 'approved'/.test(sql)) {
            return { results: [{ file_key: "materials/u1/pending.pdf", r2_url: "" }] };
          }
          if (/FROM materials WHERE user_id = \? ORDER BY/.test(sql)) return { results: [{ id: 7, title: "Notat" }] };
          if (/FROM resource_links WHERE user_id/.test(sql)) return { results: [{ id: 2, url: "https://x.example" }] };
          if (/FROM reports WHERE reporter_id/.test(sql)) return { results: [{ material_id: 7, reason: "r" }] };
          return { results: [] };
        },
      };
      return st;
    },
    async batch(statements) {
      log.batches.push(statements.map((s) => ({ sql: s.sql, args: s.args })));
      return statements.map(() => ({ meta: { changes: 1 } }));
    },
  };
  return {
    log,
    env: {
      DB: db,
      MY_BUCKET: { async delete(key) { log.deletedKeys.push(key); } },
      ENVIRONMENT: "development",
      JWT_SECRET,
    },
  };
}

async function call(env, action, { method = "GET", body } = {}) {
  return worker.fetch(
    new Request(`https://api.e-studenti.com/?action=${action}`, {
      method,
      headers: { Origin: "http://localhost:3000", Cookie: `srh_token=${await token()}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }),
    env
  );
}

describe("export-account", () => {
  it("returns the user's own data as a download", async () => {
    const { env, log } = makeEnv();
    const response = await call(env, "export-account");
    const body = await response.json();

    expect(response.headers.get("Content-Disposition")).toMatch(/attachment/);
    expect(body.account).toMatchObject({ name: "Ana", surname: "Beri", email: "student@example.com" });
    expect(body.materials).toHaveLength(1);
    expect(body.resource_links).toHaveLength(1);
    expect(body.reports_submitted).toHaveLength(1);
    // Every query is scoped to the signed-in user.
    for (const q of log.queries.filter((q) => /user_id|reporter_id/.test(q.sql))) {
      expect(q.args).toEqual([1]);
    }
  });

  it("leaves out internal moderation fields", async () => {
    const { env, log } = makeEnv();
    await call(env, "export-account");
    const sql = log.queries.map((q) => q.sql).join("\n");
    expect(sql).not.toMatch(/safety_flags|moderator_id|reviewed_by|pending_owner_email|file_key/);
  });

  it("requires sign-in", async () => {
    const { env } = makeEnv();
    const response = await worker.fetch(
      new Request("https://api.e-studenti.com/?action=export-account", { headers: { Origin: "http://localhost:3000" } }),
      env
    );
    expect(response.status).toBe(401);
  });
});

describe("delete-account", () => {
  it("requires the user to type their email", async () => {
    const { env, log } = makeEnv();
    const response = await call(env, "delete-account", { method: "POST", body: { confirm_email: "wrong@example.com" } });
    expect(response.status).toBe(400);
    expect(log.batches).toHaveLength(0);
  });

  it("refuses the moderator account", async () => {
    const { env, log } = makeEnv({ email: "edonaamulaj@gmail.com" });
    const response = await call(env, "delete-account", { method: "POST", body: { confirm_email: "edonaamulaj@gmail.com" } });
    expect(response.status).toBe(403);
    expect(log.batches).toHaveLength(0);
  });

  it("anonymises published content, deletes unpublished content and scrubs the profile", async () => {
    const { env, log } = makeEnv();
    const response = await call(env, "delete-account", { method: "POST", body: { confirm_email: "Student@Example.com" } });

    expect(response.status).toBe(200);
    expect(response.headers.get("Set-Cookie")).toMatch(/Max-Age=0/);
    expect(log.batches).toHaveLength(1);
    const sql = log.batches[0].map((s) => s.sql).join("\n");
    expect(sql).toMatch(/DELETE FROM materials WHERE user_id = \? AND status != 'approved'/);
    expect(sql).toMatch(/UPDATE materials SET is_anonymous = 1 WHERE user_id = \?/);
    expect(sql).toMatch(/DELETE FROM resource_links WHERE user_id = \? AND status != 'approved'/);
    expect(sql).toMatch(/UPDATE resource_links SET is_anonymous = 1/);
    expect(sql).toMatch(/UPDATE reports SET reporter_id = NULL/);
    expect(sql).toMatch(/DELETE FROM verification_codes/);
    const userUpdate = log.batches[0].find((s) => /UPDATE users/.test(s.sql));
    expect(userUpdate.sql).toMatch(/name = 'Anonim', surname = NULL/);
    expect(userUpdate.sql).toMatch(/email_verified = 0/);
    expect(userUpdate.sql).toMatch(/token_version = COALESCE\(token_version, 0\) \+ 1/);
    expect(userUpdate.args).toEqual(["deleted-1@deleted.invalid", 1]);
    // Never-published files are removed from storage; published ones are not.
    expect(log.deletedKeys).toEqual(["materials/u1/pending.pdf"]);
  });
});

describe("contact messages", () => {
  const rows = [{ id: 5, sender_name: "A", subject: "S", message: "Mesazh i gjatë mjaftueshëm", created_at: "2026-01-01" }];

  it("are hidden from everyone but the moderator", async () => {
    const { env } = makeEnv({ messages: rows });
    expect((await call(env, "contact-messages")).status).toBe(401);
    expect((await call(env, "delete-contact-message", { method: "POST", body: { id: 5 } })).status).toBe(401);
  });

  it("are listed for the moderator", async () => {
    const { env } = makeEnv({ email: "edonaamulaj@gmail.com", messages: rows });
    const body = await (await call(env, "contact-messages")).json();
    expect(body.total).toBe(1);
    expect(body.messages[0].subject).toBe("S");
  });

  it("can be deleted by the moderator", async () => {
    const { env, log } = makeEnv({ email: "edonaamulaj@gmail.com" });
    expect((await call(env, "delete-contact-message", { method: "POST", body: { id: 5 } })).status).toBe(200);
    expect((await call(env, "delete-contact-message", { method: "POST", body: { id: 6 } })).status).toBe(404);
    expect(log.deletedMessages).toEqual([5, 6]);
  });
});
