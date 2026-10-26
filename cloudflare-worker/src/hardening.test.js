import { describe, expect, it } from "vitest";
import worker from "./index.js";
import { buildPublicSearchClause, likePattern } from "./material-privacy.js";

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

function makeEnv({ material = { id: 3, user_id: 1, status: "approved" }, approvedUploads = 0 } = {}) {
  const calls = { userLookups: 0, updates: [] };
  const db = {
    prepare(sql) {
      let args = [];
      const st = {
        bind: (...a) => ((args = a), st),
        async run() {
          if (/UPDATE materials/.test(sql)) calls.updates.push(args);
          return { meta: { changes: 1 } };
        },
        async first() {
          if (/FROM users WHERE id/.test(sql)) {
            calls.userLookups += 1;
            return { id: 1, email: "u@example.com", name: "U", token_version: 0, is_moderator: 0 };
          }
          if (/FROM materials WHERE id/.test(sql)) return material;
          if (/FROM materials WHERE user_id/.test(sql)) return { approved: approvedUploads, pending: 0 };
          return null;
        },
        async all() {
          return { results: [] };
        },
      };
      return st;
    },
  };
  return { calls, env: { DB: db, MY_BUCKET: {}, ENVIRONMENT: "development", JWT_SECRET } };
}

async function call(env, action, body) {
  return worker.fetch(
    new Request(`https://api.e-studenti.com/?action=${action}&id=3`, {
      method: "POST",
      headers: { Origin: "http://localhost:3000", Cookie: `srh_token=${await token()}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    env
  );
}

const editBody = { title: "T", faculty: "MED", subject: "S", type: "Afat" };

describe("edit allowlists", () => {
  it("rejects an unknown faculty", async () => {
    const { env, calls } = makeEnv();
    const response = await call(env, "edit", { ...editBody, faculty: "NOPE" });
    expect(response.status).toBe(400);
    expect(calls.updates).toHaveLength(0);
  });

  it("rejects an unknown type", async () => {
    const { env, calls } = makeEnv();
    const response = await call(env, "edit", { ...editBody, type: "Çfarëdo" });
    expect(response.status).toBe(400);
    expect(calls.updates).toHaveLength(0);
  });

  it("accepts a valid edit", async () => {
    const { env } = makeEnv();
    expect((await call(env, "edit", editBody)).status).toBe(200);
  });
});

describe("edits to a published material", () => {
  // UPDATE materials ... bind(title, university, faculty, department, subject, teacher, type, level, resubmit, ...)
  const resubmitFlag = (calls) => calls.updates[0][8];

  it("go back to review when the owner is not yet trusted", async () => {
    const { env, calls } = makeEnv({ approvedUploads: 1 });
    const response = await call(env, "edit", editBody);
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("pending");
    expect(resubmitFlag(calls)).toBe(1);
  });

  it("stay published for a trusted owner", async () => {
    const { env, calls } = makeEnv({ approvedUploads: 3 });
    const response = await call(env, "edit", editBody);
    expect((await response.json()).status).toBe("approved");
    expect(resubmitFlag(calls)).toBe(0);
  });
});

describe("state-changing actions", () => {
  it.each(["logout", "edit", "delete-material", "upload", "verify", "moderate-resource-link"])(
    "refuse GET for %s (Lax cookies ride along on cross-site navigations)",
    async (action) => {
      const { env, calls } = makeEnv();
      const response = await worker.fetch(
        new Request(`https://api.e-studenti.com/?action=${action}&id=3`, {
          headers: { Cookie: `srh_token=${await token()}` },
        }),
        env
      );
      expect(response.status).toBe(405);
      expect(calls.updates).toHaveLength(0);
    }
  );
});

describe("authentication is resolved once per request", () => {
  it("looks the user up a single time for an edit", async () => {
    const { env, calls } = makeEnv();
    await call(env, "edit", editBody);
    expect(calls.userLookups).toBe(1);
  });
});

describe("configuration", () => {
  it("answers 503 rather than failing obscurely when JWT_SECRET is missing", async () => {
    const { env } = makeEnv();
    delete env.JWT_SECRET;
    const response = await worker.fetch(
      new Request("https://api.e-studenti.com/?action=me", { headers: { Origin: "http://localhost:3000" } }),
      env
    );
    expect(response.status).toBe(503);
  });
});

describe("search wildcards", () => {
  it("escapes % and _ so they match literally", () => {
    expect(likePattern("100%")).toBe("%100\\%%");
    expect(likePattern("a_b")).toBe("%a\\_b%");
    expect(likePattern("a\\b")).toBe("%a\\\\b%");
  });

  it("uses ESCAPE on every LIKE", () => {
    const { clause } = buildPublicSearchClause("x");
    expect((clause.match(/LIKE/g) || []).length).toBe((clause.match(/ESCAPE/g) || []).length);
  });
});

describe("proxy responses", () => {
  it("are sandboxed", async () => {
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response("%PDF", { status: 200, headers: { "Content-Type": "application/pdf" } });
    try {
      const { env } = makeEnv();
      const response = await worker.fetch(
        new Request(
          `https://api.e-studenti.com/?action=proxy&url=${encodeURIComponent("https://media.e-studenti.com/materials/a/x.pdf")}`,
          { headers: { Origin: "http://localhost:3000" } }
        ),
        env
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Security-Policy")).toMatch(/sandbox/);
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});

describe("verification lockout", () => {
  function lockoutEnv() {
    const counters = new Map();
    const db = {
      prepare(sql) {
        let args = [];
        const st = {
          bind: (...a) => ((args = a), st),
          async run() {
            if (/INSERT INTO rate_limits/.test(sql)) {
              const [key, resetAt, , , , , cap] = args;
              const row = counters.get(key) || { count: 0, reset_at: resetAt };
              if (row.count >= cap) return { meta: { changes: 0 } };
              counters.set(key, { count: row.count + 1, reset_at: row.reset_at });
              return { meta: { changes: 1 } };
            }
            return { meta: { changes: 1 } };
          },
          async first() {
            if (/FROM rate_limits WHERE key/.test(sql)) return counters.get(args[0]) || null;
            if (/FROM verification_codes/.test(sql)) {
              return { email: "v@gmail.com", code: "not-a-match", expires_at: new Date(Date.now() + 600000).toISOString() };
            }
            return null;
          },
          async all() {
            return { results: [] };
          },
        };
        return st;
      },
    };
    return { counters, env: { DB: db, ENVIRONMENT: "development", JWT_SECRET } };
  }

  const verify = (env, ip) =>
    worker.fetch(
      new Request("https://api.e-studenti.com/?action=verify", {
        method: "POST",
        headers: { Origin: "http://localhost:3000", "Content-Type": "application/json", "CF-Connecting-IP": ip },
        body: JSON.stringify({ email: "v@gmail.com", code: "123456" }),
      }),
      env
    );

  it("one address's wrong guesses do not lock the account for everyone else", async () => {
    const { env } = lockoutEnv();
    for (let i = 0; i < 5; i += 1) await verify(env, "1.1.1.1");
    const attacker = await verify(env, "1.1.1.1");
    expect(attacker.status).toBe(429);

    const owner = await verify(env, "2.2.2.2");
    expect(owner.status).toBe(400); // a wrong code, not a lockout
  });
});
