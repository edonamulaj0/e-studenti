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

const EXISTING = {
  id: 41, title: "Notat", faculty: "MED", department: "//", subject: "S", teacher: "//",
  type: "Afat", file_type: "pdf", file_size: 2048, r2_url: "https://media.e-studenti.com/materials/x/n.pdf", status: "pending",
};

function makeEnv({ counts = { approved: 0, pending: 0 }, existingByClientId = null, insertThrows = null, dupRows = [] } = {}) {
  const log = { inserts: [], puts: [], deleted: [], lookups: 0, dupQuery: null };
  const db = {
    prepare(sql) {
      let args = [];
      const st = {
        bind: (...a) => ((args = a), st),
        async run() {
          if (/INSERT INTO materials/.test(sql)) {
            if (insertThrows) throw insertThrows;
            log.inserts.push({ sql, args });
            return { meta: { last_row_id: 99, changes: 1 } };
          }
          return { meta: { changes: 1 } };
        },
        async first() {
          if (/FROM users WHERE id/.test(sql)) {
            return { id: 1, email: "u@example.com", name: "U", token_version: 0, is_moderator: 0 };
          }
          if (/SUM\(CASE WHEN status/.test(sql)) return counts;
          if (/client_upload_id = \?/.test(sql)) {
            log.lookups += 1;
            return existingByClientId;
          }
          return null;
        },
        async all() {
          if (/content_hash IN/.test(sql)) {
            log.dupQuery = { sql, args };
            return { results: dupRows };
          }
          return { results: [] };
        },
      };
      return st;
    },
  };
  return {
    log,
    env: {
      DB: db,
      MY_BUCKET: { async put(key) { log.puts.push(key); }, async delete(key) { log.deleted.push(key); } },
      ENVIRONMENT: "development",
      JWT_SECRET,
    },
  };
}

const pdf = () => {
  const b = new Uint8Array(2048);
  b.set([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31], 0);
  return new File([b], "x.pdf", { type: "application/pdf" });
};

async function upload(env, { clientId, hash } = {}) {
  const form = new FormData();
  form.append("title", "T");
  form.append("faculty", "MED");
  form.append("subject", "Anatomi");
  form.append("type", "Afat");
  if (hash !== undefined) form.append("content_hash", hash);
  form.append("file", pdf());
  const qs = clientId ? `&client_upload_id=${clientId}` : "";
  return worker.fetch(
    new Request(`https://api.e-studenti.com/?action=upload${qs}`, {
      method: "POST",
      headers: { Origin: "http://localhost:3000", Cookie: `srh_token=${await token()}` },
      body: form,
    }),
    env
  );
}

const ID = "6f1c2a52-8c4e-4c8a-9d51-0f3a5d2b7e10";
const HASH = "a".repeat(64);

describe("retrying an upload that already went through", () => {
  it("returns the stored row and stores nothing again", async () => {
    const { env, log } = makeEnv({ existingByClientId: EXISTING });
    const body = await (await upload(env, { clientId: ID })).json();

    expect(body).toMatchObject({ success: true, duplicate: true, status: "pending" });
    expect(body.material.id).toBe(41);
    expect(log.puts).toHaveLength(0);
    expect(log.inserts).toHaveLength(0);
  });

  it("is honoured even when the pending-review limit is reached", async () => {
    const { env } = makeEnv({ counts: { approved: 0, pending: 10 }, existingByClientId: EXISTING });
    const response = await upload(env, { clientId: ID });
    expect(response.status).toBe(200);
  });

  it("ignores a malformed id", async () => {
    const { env, log } = makeEnv({ existingByClientId: EXISTING });
    await upload(env, { clientId: "x'; DROP--" });
    expect(log.lookups).toBe(0);
  });

  it("answers with the winner when two requests with one id race", async () => {
    const { env, log } = makeEnv({
      insertThrows: new Error("D1_ERROR: UNIQUE constraint failed: materials.user_id, materials.client_upload_id"),
    });
    // First lookup (before the insert) finds nothing; the lookup after the failure finds the winner.
    let calls = 0;
    const realPrepare = env.DB.prepare.bind(env.DB);
    env.DB.prepare = (sql) => {
      const st = realPrepare(sql);
      if (/client_upload_id = \?/.test(sql)) {
        const first = st.first.bind(st);
        st.first = async () => ((calls += 1) === 1 ? null : EXISTING);
        void first;
      }
      return st;
    };
    const body = await (await upload(env, { clientId: ID })).json();

    expect(body.duplicate).toBe(true);
    expect(log.puts).toHaveLength(1);
    expect(log.deleted).toEqual(log.puts); // the losing copy is removed
  });
});

describe("pending-review limit", () => {
  it("is reported with a code the client can act on", async () => {
    const { env } = makeEnv({ counts: { approved: 0, pending: 10 } });
    const response = await upload(env, { clientId: ID });
    const body = await response.json();
    expect(response.status).toBe(429);
    expect(body.code).toBe("pending_limit");
  });
});

describe("content hash", () => {
  it("is stored when well formed", async () => {
    const { env, log } = makeEnv();
    await upload(env, { clientId: ID, hash: HASH.toUpperCase() });
    const args = log.inserts[0].args;
    expect(args).toContain(HASH);
    expect(args).toContain(ID);
  });

  it("is dropped when malformed", async () => {
    const { env, log } = makeEnv();
    await upload(env, { hash: "not-a-hash" });
    expect(log.inserts[0].args).not.toContain("not-a-hash");
  });
});

describe("check-duplicates", () => {
  const check = async (env, hashes) =>
    worker.fetch(
      new Request("https://api.e-studenti.com/?action=check-duplicates", {
        method: "POST",
        headers: { Origin: "http://localhost:3000", Cookie: `srh_token=${await token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ hashes }),
      }),
      env
    );

  it("requires sign-in", async () => {
    const { env } = makeEnv();
    const response = await worker.fetch(
      new Request("https://api.e-studenti.com/?action=check-duplicates", {
        method: "POST",
        headers: { Origin: "http://localhost:3000", "Content-Type": "application/json" },
        body: "{}",
      }),
      env
    );
    expect(response.status).toBe(401);
  });

  it("queries only valid, distinct hashes and only for published or own materials", async () => {
    const { env, log } = makeEnv({
      dupRows: [
        { id: 3, title: "Public", content_hash: HASH, user_id: 2, status: "approved" },
        { id: 8, title: "Same hash again", content_hash: HASH, user_id: 3, status: "approved" },
        { id: 9, title: "Mine", content_hash: "b".repeat(64), user_id: 1, status: "pending" },
      ],
    });
    const body = await (await check(env, [HASH, HASH, "zzz", "B".repeat(64), 5])).json();

    expect(log.dupQuery.args).toEqual([HASH, "b".repeat(64), 1]);
    expect(log.dupQuery.sql).toMatch(/status = 'approved' OR user_id = \?/);
    expect(body.duplicates).toHaveLength(2);
    expect(body.duplicates[0]).toMatchObject({ hash: HASH, id: 3, own: false });
    expect(body.duplicates[1]).toMatchObject({ id: 9, own: true, status: "pending" });
  });

  it("answers empty without touching the database when nothing valid was sent", async () => {
    const { env, log } = makeEnv();
    const body = await (await check(env, ["nope"])).json();
    expect(body.duplicates).toEqual([]);
    expect(log.dupQuery).toBeNull();
  });
});
