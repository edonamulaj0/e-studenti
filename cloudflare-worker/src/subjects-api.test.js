import { describe, expect, it } from "vitest";
import worker from "./index.js";

const JWT_SECRET = "test-secret-test-secret-test-secret";
const MOD = "edonaamulaj@gmail.com";
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

const ROWS = [
  { id: 1, faculty: "MED", subject: "Anatomi", type: "Ligjerata", teacher: "Prof. A", created_at: "2026-01-01", title: "Notat 1", status: "approved", user_id: 5 },
  { id: 2, faculty: "MED", subject: "anatomi", type: "Afat", teacher: "//", created_at: "2026-03-01", title: "Afati qershor", status: "approved", user_id: 5 },
  { id: 3, faculty: "MED", subject: "Anatomi", type: "Afat", teacher: "Prof. A", created_at: "2026-02-01", title: "Afati shtator", status: "approved", user_id: 6 },
  { id: 4, faculty: "FIEK", subject: "Algoritme", type: "Projekt", teacher: "//", created_at: "2026-01-05", title: "Projekt", status: "approved", user_id: 6 },
  { id: 5, faculty: "MED", subject: "Anatomi", type: "Ligjerata", teacher: "//", created_at: "2026-01-09", title: "Ende pa aprovuar", status: "pending", user_id: 6 },
];

function makeEnv({ email = "student@example.com", rows = ROWS.map((r) => ({ ...r })) } = {}) {
  const log = { updates: [] };
  const db = {
    prepare(sql) {
      let args = [];
      const st = {
        bind: (...a) => ((args = a), st),
        async run() {
          if (/UPDATE materials SET subject/.test(sql)) {
            const [target, faculty, ...spellings] = args;
            let n = 0;
            for (const r of rows) if (r.faculty === faculty && spellings.includes(r.subject)) { r.subject = target; n += 1; }
            log.updates.push({ target, faculty, spellings });
            return { meta: { changes: n } };
          }
          return { meta: { changes: 1 } };
        },
        async first() {
          if (/FROM users WHERE id/.test(sql)) return { id: 1, email, name: "U", token_version: 0 };
          return null;
        },
        async all() {
          if (/FROM materials WHERE status = 'approved'/.test(sql) && /SELECT id, faculty, subject/.test(sql)) {
            return { results: rows.filter((r) => r.status === "approved") };
          }
          if (/SELECT id, title, faculty FROM materials WHERE status/.test(sql)) {
            return { results: rows.filter((r) => r.status === "approved") };
          }
          if (/SELECT id, faculty, subject, type, teacher FROM materials/.test(sql)) return { results: rows };
          if (/SELECT DISTINCT subject FROM materials WHERE faculty/.test(sql)) {
            return { results: [...new Set(rows.filter((r) => r.faculty === args[0]).map((r) => r.subject))].map((subject) => ({ subject })) };
          }
          if (/FROM materials m LEFT JOIN users u/.test(sql) && /m\.id IN/.test(sql)) {
            return { results: rows.filter((r) => args.includes(r.id) && r.status === "approved").map((r) => ({ ...r, uploader_name: "Ana Beri", uploader_trusted: 1, is_anonymous: r.id === 3 ? 1 : 0 })) };
          }
          return { results: [] };
        },
      };
      return st;
    },
  };
  return { log, rows, env: { DB: db, ENVIRONMENT: "development", JWT_SECRET } };
}

const get = (env, qs, cookie = false) =>
  worker.fetch(new Request(`https://api.e-studenti.com/?${qs}`, { headers: { Origin: "https://e-studenti.com" } }), env);

async function post(env, action, body) {
  return worker.fetch(
    new Request(`https://api.e-studenti.com/?action=${action}`, {
      method: "POST",
      headers: { Origin: "https://e-studenti.com", Cookie: `srh_token=${await token()}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    env
  );
}

describe("subjects list", () => {
  it("merges spelling variants and counts only published materials", async () => {
    const body = await (await get(makeEnv().env, "action=subjects")).json();
    const anatomi = body.subjects.find((s) => s.slug === "anatomi-med");
    expect(anatomi.count).toBe(3); // the pending one is not counted
    expect(body.subjects.map((s) => s.slug).sort()).toEqual(["algoritme-fiek", "anatomi-med"]);
  });

  it("can be limited to one faculty", async () => {
    const body = await (await get(makeEnv().env, "action=subjects&faculty=fiek")).json();
    expect(body.subjects.map((s) => s.slug)).toEqual(["algoritme-fiek"]);
  });
});

describe("subject page data", () => {
  it("puts exams first, newest first within a type", async () => {
    const body = await (await get(makeEnv().env, "action=subject-public&slug=anatomi-med")).json();
    expect(body.subject).toMatchObject({ name: "Anatomi", faculty: "MED", count: 3, teachers: ["Prof. A"] });
    expect(body.materials.map((m) => m.id)).toEqual([2, 3, 1]); // Afat (Mar, Feb) then Ligjerata
  });

  it("does not expose unpublished materials, user ids or the name of an anonymous uploader", async () => {
    const body = await (await get(makeEnv().env, "action=subject-public&slug=anatomi-med")).json();
    expect(body.materials.some((m) => m.id === 5)).toBe(false);
    for (const m of body.materials) expect("user_id" in m).toBe(false);
    const anonymous = body.materials.find((m) => m.id === 3);
    expect(anonymous.uploader_name).toBeUndefined();
    expect(anonymous.uploader_trusted).toBeUndefined();
  });

  it("answers 404 for an unknown subject", async () => {
    expect((await get(makeEnv().env, "action=subject-public&slug=nuk-ekziston-med")).status).toBe(404);
  });
});

describe("merging subjects (moderator)", () => {
  it("is refused for everyone else", async () => {
    const { env, log } = makeEnv();
    expect((await post(env, "rename-subject", { faculty: "MED", key: "anatomi", to: "Anatomia" })).status).toBe(401);
    expect(log.updates).toHaveLength(0);
  });

  it("rewrites every spelling of the subject, including unpublished materials", async () => {
    const { env, rows, log } = makeEnv({ email: MOD });
    const body = await (await post(env, "rename-subject", { faculty: "MED", key: "anatomi", to: "  Anatomia   e njeriut " })).json();
    expect(body.updated).toBe(4);
    expect(log.updates[0].spellings.sort()).toEqual(["Anatomi", "anatomi"]);
    expect(rows.filter((r) => r.faculty === "MED").every((r) => r.subject === "Anatomia e njeriut")).toBe(true);
    expect(rows.find((r) => r.faculty === "FIEK").subject).toBe("Algoritme"); // other faculty untouched
  });

  it("rejects markup and the empty name", async () => {
    const { env } = makeEnv({ email: MOD });
    expect((await post(env, "rename-subject", { faculty: "MED", key: "anatomi", to: "<b>x</b>" })).status).toBe(400);
    expect((await post(env, "rename-subject", { faculty: "MED", key: "anatomi", to: "//" })).status).toBe(400);
  });

  it("404s a subject that does not exist", async () => {
    const { env } = makeEnv({ email: MOD });
    expect((await post(env, "rename-subject", { faculty: "MED", key: "fizika", to: "Fizikë" })).status).toBe(404);
  });

  it("lists every spelling for the moderator only", async () => {
    expect((await get(makeEnv().env, "action=subject-admin")).status).toBe(401);
    const res = await worker.fetch(
      new Request("https://api.e-studenti.com/?action=subject-admin", { headers: { Origin: "https://e-studenti.com", Cookie: `srh_token=${await token()}` } }),
      makeEnv({ email: MOD }).env
    );
    const body = await res.json();
    expect(body.subjects.find((s) => s.slug === "anatomi-med").variants.map((v) => v.name).sort()).toEqual(["Anatomi", "anatomi"]);
  });
});
