import { describe, expect, it } from "vitest";
import worker from "./index.js";
import { MODERATOR_EMAIL } from "./moderators.js";
import { createTestD1 } from "./test-d1.js";

const JWT_SECRET = "test-secret-test-secret-test-secret";
const enc = new TextEncoder();
const b64 = (bytes) =>
  Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function token(sub) {
  const now = Math.floor(Date.now() / 1000);
  const data = `${b64(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })))}.${b64(
    enc.encode(JSON.stringify({ sub, iat: now, exp: now + 3600, iss: "https://e-studenti.com", aud: "https://e-studenti.com", tv: 0 }))
  )}`;
  const key = await crypto.subtle.importKey("raw", enc.encode(JWT_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return `${data}.${b64(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data))))}`;
}

function setup() {
  const db = createTestD1();
  db.raw.exec(`
    INSERT INTO users (id, name, email, email_verified) VALUES (3, 'M', '${MODERATOR_EMAIL}', 1), (1, 'A', 'a@gmail.com', 1);
    INSERT INTO materials (id, user_id, title, faculty, subject, type, file_key, file_type, r2_url, status, created_at) VALUES
      (1, 1, 'Afatet e Elektronikës', 'FIEK', 'Elektronika', 'Afat', 'k1', 'pdf', 'https://media.e-studenti.com/k1', 'approved', '2026-01-01'),
      (2, 1, 'Ligjërata Fizika', 'FIEK', 'Fizika', 'Ligjerata', 'k2', 'pdf', 'https://media.e-studenti.com/k2', 'approved', '2026-02-01'),
      (3, 1, 'Në pritje', 'FIEK', 'Fizika', 'Ligjerata', 'k3', 'pdf', 'https://media.e-studenti.com/k3', 'pending', '2026-03-01');
  `);
  return { db, env: { DB: db, ENVIRONMENT: "development", JWT_SECRET } };
}

const call = async (env, action, { ip = "1.1.1.1", user, body, query = "" } = {}) => {
  const headers = { "CF-Connecting-IP": ip, Origin: "http://localhost:3000" };
  if (user) headers.Cookie = `srh_token=${await token(user)}`;
  if (body) headers["Content-Type"] = "application/json";
  const res = await worker.fetch(
    new Request(`https://api.e-studenti.com/?action=${action}${query}`, {
      method: body ? "POST" : "GET",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }),
    env
  );
  return { status: res.status, data: await res.json() };
};
const vote = (env, material_id, helpful, opts = {}) => call(env, "rate-material", { ...opts, body: { material_id, helpful } });

describe("helpful votes", () => {
  it("count one vote per person, which can be changed or withdrawn", async () => {
    const { env } = setup();
    await vote(env, 1, true);
    await vote(env, 1, true);
    await vote(env, 1, true, { ip: "2.2.2.2" });
    expect((await vote(env, 1, false, { user: 1 })).data).toEqual({ helpful: 2, unhelpful: 1, mine: false });

    expect((await vote(env, 1, false)).data).toMatchObject({ helpful: 1, unhelpful: 2 });
    expect((await vote(env, 1, null, { ip: "2.2.2.2" })).data).toMatchObject({ helpful: 0, unhelpful: 2 });

    const rating = await call(env, "material-rating", { query: "&material_id=1" });
    expect(rating.data).toEqual({ helpful: 0, unhelpful: 2, mine: false });
    expect((await call(env, "material-rating", { query: "&material_id=1", ip: "9.9.9.9" })).data.mine).toBeNull();
  });

  it("are refused for unpublished materials, bad values and GET requests", async () => {
    const { env } = setup();
    expect((await vote(env, 3, true)).status).toBe(404);
    expect((await vote(env, 1, "yes")).status).toBe(400);
    expect((await call(env, "rate-material", { query: "&material_id=1&helpful=true" })).status).toBe(405);
    expect((await call(env, "material-rating", { query: "&material_id=3" })).status).toBe(404);
  });

  it("order the catalog when sorting by usefulness", async () => {
    const { env } = setup();
    await vote(env, 1, true);
    await vote(env, 1, true, { ip: "2.2.2.2" });
    await vote(env, 2, false);
    const { data } = await call(env, "materials", { query: "&sort=helpful" });
    expect(data.materials.map((m) => m.id)).toEqual([1, 2]);
    const newest = await call(env, "materials");
    expect(newest.data.materials.map((m) => m.id)).toEqual([2, 1]);
  });

  it("put files most people found unhelpful before the moderator only", async () => {
    const { env } = setup();
    for (const ip of ["1.1.1.1", "2.2.2.2", "3.3.3.3"]) await vote(env, 2, false, { ip });
    await vote(env, 1, false);
    expect((await call(env, "low-rated", { user: 1 })).status).toBe(403);
    const { data } = await call(env, "low-rated", { user: 3 });
    expect(data.materials.map((m) => [m.id, m.unhelpful_count])).toEqual([[2, 3]]);
  });

  it("stop pointing at the account once it is deleted, but keep counting", async () => {
    const { env, db } = setup();
    await vote(env, 1, true, { user: 1 });
    expect((await call(env, "delete-account", { user: 1, body: { confirm_email: "a@gmail.com" } })).status).toBe(200);
    const keys = db.raw.prepare("SELECT voter_key FROM material_votes").all().map((r) => r.voter_key);
    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatch(/^gone:/);
    expect(db.raw.prepare("SELECT helpful_count FROM materials WHERE id = 1").get().helpful_count).toBe(1);
  });
});
