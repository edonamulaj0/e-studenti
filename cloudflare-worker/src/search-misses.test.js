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
    INSERT INTO materials (user_id, title, university, faculty, subject, type, file_key, file_type, r2_url, status)
      VALUES (1, 'Afatet e Elektronikës', 'universiteti-i-prishtines-hasan-prishtina', 'FIEK', 'Elektronika', 'Afat', 'k', 'pdf', 'https://media.e-studenti.com/k', 'approved');
  `);
  return { db, env: { DB: db, ENVIRONMENT: "development", JWT_SECRET } };
}

const search = (env, query, ip = "1.1.1.1") =>
  worker.fetch(new Request(`https://api.e-studenti.com/?action=materials&${query}`, { headers: { "CF-Connecting-IP": ip } }), env);
const misses = (db) => db.raw.prepare("SELECT query, count FROM search_misses ORDER BY query").all();

describe("searches with no results", () => {
  it("are counted by their folded words only", async () => {
    const { env, db } = setup();
    await search(env, "q=Kimi%20Organike");
    await search(env, "q=kimi%20organikë", "2.2.2.2");
    expect(misses(db)).toEqual([{ query: "kimi organike", count: 2 }]);
    expect(Object.keys(db.raw.prepare("SELECT * FROM search_misses").get())).not.toContain("ip");
  });

  it("are not counted when something was found, when filters are set, or past page 1", async () => {
    const { env, db } = setup();
    await search(env, "q=elektronika");
    await search(env, "q=kimi&faculty=MED");
    await search(env, "q=kimi&page=2");
    await search(env, "q=x");
    expect(misses(db)).toEqual([]);
  });

  it("cannot be flooded from one address", async () => {
    const { env, db } = setup();
    for (let i = 0; i < 30; i += 1) await search(env, `q=fjale${i}`);
    expect(misses(db)).toHaveLength(20);
  });

  it("are shown to the moderator only, who can dismiss them", async () => {
    const { env, db } = setup();
    await search(env, "q=kimi");
    const asUser = async (user, action, init = {}) =>
      worker.fetch(
        new Request(`https://api.e-studenti.com/?action=${action}`, {
          ...init,
          headers: { Origin: "http://localhost:3000", Cookie: `srh_token=${await token(user)}`, "Content-Type": "application/json" },
        }),
        env
      );
    expect((await asUser(1, "search-misses")).status).toBe(401);
    const list = await (await asUser(3, "search-misses")).json();
    expect(list.misses).toEqual([expect.objectContaining({ query: "kimi", count: 1 })]);
    await asUser(3, "dismiss-search-miss", { method: "POST", body: JSON.stringify({ query: "kimi" }) });
    expect((await (await asUser(3, "search-misses")).json()).misses).toEqual([]);
    expect(misses(db)).toHaveLength(1); // kept, so it is not shown again
  });
});
