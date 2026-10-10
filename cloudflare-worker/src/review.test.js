import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "./index.js";

const JWT_SECRET = "test-secret-test-secret-test-secret";
const enc = new TextEncoder();
const b64 = (bytes) =>
  Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function token(sub) {
  const now = Math.floor(Date.now() / 1000);
  const data = `${b64(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })))}.${b64(
    enc.encode(
      JSON.stringify({
        sub,
        iat: now,
        exp: now + 3600,
        iss: "https://e-studenti.com",
        aud: "https://e-studenti.com",
        tv: 0,
      })
    )
  )}`;
  const key = await crypto.subtle.importKey("raw", enc.encode(JWT_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return `${data}.${b64(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data))))}`;
}

/** counts: { approved, pending } for the uploading user; moderator: boolean. */
function makeEnv({ counts = { approved: 0, pending: 0 }, moderator = false, material = null, reviewChanges = 1 } = {}) {
  const inserts = [];
  const updates = [];
  const db = {
    prepare(sql) {
      let args = [];
      const st = {
        bind: (...a) => ((args = a), st),
        async run() {
          if (/INSERT INTO materials/.test(sql)) {
            inserts.push(args);
            return { meta: { last_row_id: 9, changes: 1 } };
          }
          if (/UPDATE materials/.test(sql)) {
            updates.push({ sql, args });
            return { meta: { changes: /status = \?/.test(sql) ? reviewChanges : 1 } };
          }
          return { meta: { changes: 1 } };
        },
        async first() {
          if (/FROM users WHERE id/.test(sql)) {
            return { id: 1, email: "u@example.com", name: "U", token_version: 0, is_moderator: moderator ? 1 : 0 };
          }
          if (/SUM\(CASE WHEN status/.test(sql)) return counts;
          if (/FROM materials WHERE id = \?/.test(sql) || /FROM materials WHERE id=\?/.test(sql)) return material;
          if (/JOIN users u ON u.id = m.user_id/.test(sql)) return { title: "T", email: "owner@example.com" };
          return null;
        },
        async all() {
          return { results: [] };
        },
      };
      return st;
    },
  };
  return {
    inserts,
    updates,
    env: {
      DB: db,
      MY_BUCKET: { async put() {} },
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

async function upload(env) {
  const form = new FormData();
  form.append("title", "T");
  form.append("faculty", "MED");
  form.append("subject", "Anatomi");
  form.append("type", "Afat");
  form.append("file", pdf());
  return worker.fetch(
    new Request("https://api.e-studenti.com/?action=upload", {
      method: "POST",
      headers: { Origin: "http://localhost:3000", Cookie: `srh_token=${await token(1)}` },
      body: form,
    }),
    env
  );
}

async function post(env, action, body) {
  return worker.fetch(
    new Request(`https://api.e-studenti.com/?action=${action}`, {
      method: "POST",
      headers: {
        Origin: "http://localhost:3000",
        Cookie: `srh_token=${await token(1)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }),
    env
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("upload review status", () => {
  it("holds a new user's upload for review", async () => {
    const { env, inserts } = makeEnv({ counts: { approved: 0, pending: 0 } });
    const body = await (await upload(env)).json();
    expect(body.status).toBe("pending");
    expect(inserts[0].at(-1)).toBe("pending");
  });

  it("holds uploads until the user has enough approved materials", async () => {
    const { env } = makeEnv({ counts: { approved: 2, pending: 0 } });
    expect((await (await upload(env)).json()).status).toBe("pending");
  });

  it("publishes a trusted user's upload immediately", async () => {
    const { env, inserts } = makeEnv({ counts: { approved: 3, pending: 0 } });
    const body = await (await upload(env)).json();
    expect(body.status).toBe("approved");
    expect(inserts[0].at(-1)).toBe("approved");
  });

  it("never holds a moderator's upload", async () => {
    const { env } = makeEnv({ moderator: true, counts: { approved: 0, pending: 0 } });
    expect((await (await upload(env)).json()).status).toBe("approved");
  });

  it("refuses more uploads when ten are already waiting", async () => {
    const { env, inserts } = makeEnv({ counts: { approved: 0, pending: 10 } });
    const response = await upload(env);
    expect(response.status).toBe(429);
    expect(inserts).toHaveLength(0);
  });
});

describe("review-material", () => {
  it("is refused for non-moderators", async () => {
    const { env, updates } = makeEnv();
    const response = await post(env, "review-material", { id: 4, decision: "approve" });
    expect(response.status).toBe(401);
    expect(updates).toHaveLength(0);
  });

  it("approves a pending material and only acts on pending rows", async () => {
    vi.stubGlobal("fetch", async () => new Response("{}", { status: 200 }));
    const { env, updates } = makeEnv({ moderator: true });
    const body = await (await post(env, "review-material", { id: 4, decision: "approve" })).json();
    expect(body.status).toBe("approved");
    expect(updates[0].sql).toMatch(/AND status = 'pending'/);
    expect(updates[0].args[0]).toBe("approved");
  });

  it("requires a reason to reject", async () => {
    const { env, updates } = makeEnv({ moderator: true });
    const response = await post(env, "review-material", { id: 4, decision: "reject", reason: "no" });
    expect(response.status).toBe(400);
    expect(updates).toHaveLength(0);
  });

  it("stores the rejection reason", async () => {
    vi.stubGlobal("fetch", async () => new Response("{}", { status: 200 }));
    const { env, updates } = makeEnv({ moderator: true });
    const body = await (
      await post(env, "review-material", { id: 4, decision: "reject", reason: "Jo material akademik" })
    ).json();
    expect(body.status).toBe("rejected");
    expect(updates[0].args.slice(0, 2)).toEqual(["rejected", "Jo material akademik"]);
  });

  it("reports an already-reviewed material instead of overwriting it", async () => {
    const { env } = makeEnv({ moderator: true, reviewChanges: 0 });
    const response = await post(env, "review-material", { id: 4, decision: "approve" });
    expect(response.status).toBe(404);
  });
});

describe("visibility of unreviewed materials", () => {
  async function redirect(env) {
    return worker.fetch(
      new Request("https://api.e-studenti.com/?action=download-material&id=4", {
        headers: { Origin: "http://localhost:3000", Cookie: `srh_token=${await token(1)}`, "User-Agent": "Mozilla/5.0" },
        redirect: "manual",
      }),
      env
    );
  }
  const row = (over) => ({
    id: 4,
    user_id: 2,
    status: "pending",
    r2_url: "https://media.e-studenti.com/materials/abc/x.pdf",
    file_key: "materials/abc/x.pdf",
    ...over,
  });

  it("404s a pending file for someone who is neither owner nor moderator", async () => {
    const { env } = makeEnv({ material: row({}) });
    expect((await redirect(env)).status).toBe(404);
  });

  it("lets the owner open their own pending file", async () => {
    const { env } = makeEnv({ material: row({ user_id: 1 }) });
    expect((await redirect(env)).status).toBe(302);
  });

  it("lets a moderator open a pending file", async () => {
    const { env } = makeEnv({ moderator: true, material: row({}) });
    expect((await redirect(env)).status).toBe(302);
  });

  it("serves an approved file to anyone", async () => {
    const { env } = makeEnv({ material: row({ status: "approved" }) });
    expect((await redirect(env)).status).toBe(302);
  });
});
