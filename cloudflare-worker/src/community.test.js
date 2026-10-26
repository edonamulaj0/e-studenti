import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker, { fulfillRequestForMaterial, sendSubjectDigest } from "./index.js";
import { MODERATOR_EMAIL } from "./moderators.js";
import { createTestD1 } from "./test-d1.js";

const JWT_SECRET = "test-secret-test-secret-test-secret";
const UP = "universiteti-i-prishtines-hasan-prishtina";
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

/** Resend calls made during a test. */
let emails;

function setup() {
  const db = createTestD1();
  db.raw.exec(`
    INSERT INTO users (id, name, surname, email, email_verified) VALUES
      (1, 'Arta', 'A', 'arta@gmail.com', 1),
      (2, 'Besa', 'B', 'besa@gmail.com', 1),
      (3, 'Moderatorja', 'M', '${MODERATOR_EMAIL}', 1);
    INSERT INTO materials (user_id, title, university, faculty, subject, type, file_key, file_type, r2_url, status, created_at)
      VALUES (1, 'Afatet e Elektronikës', '${UP}', 'FIEK', 'Elektronika', 'Afat', 'k1', 'pdf', 'https://media.e-studenti.com/k1', 'approved', '2026-01-01 10:00:00');
  `);
  return { db, env: { DB: db, ENVIRONMENT: "development", JWT_SECRET, RESEND_API_KEY: "test" } };
}

async function call(env, action, { user, body, method = "POST", query = "" } = {}) {
  const headers = { Origin: "http://localhost:3000", "Content-Type": "application/json" };
  if (user) headers.Cookie = `srh_token=${await token(user)}`;
  const response = await worker.fetch(
    new Request(`https://api.e-studenti.com/?action=${action}${query}`, {
      method,
      headers,
      body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
    }),
    env
  );
  return { status: response.status, body: await response.json() };
}

beforeEach(() => {
  emails = [];
  vi.stubGlobal("fetch", async (url, init) => {
    if (String(url).startsWith("https://api.resend.com/")) {
      emails.push(JSON.parse(init.body));
      return new Response("{}", { status: 200 });
    }
    return new Response("{}", { status: 200 });
  });
});
afterEach(() => vi.unstubAllGlobals());

const ask = { university: UP, faculty: "FIEK", subject: "Matematika 2", type: "Afat", details: "Afatet e 2025" };

describe("material requests", () => {
  it("collects a duplicate request as a vote and never names the requester", async () => {
    const { env } = setup();
    const first = await call(env, "create-request", { user: 1, body: ask });
    expect(first.status).toBe(200);
    const second = await call(env, "create-request", { user: 2, body: { ...ask, subject: "matematika  2" } });
    expect(second.body).toMatchObject({ id: first.body.id, merged: true });

    const list = await call(env, "requests", { method: "GET", user: 2 });
    expect(list.body.requests).toHaveLength(1);
    const [request] = list.body.requests;
    expect(request).toMatchObject({ subject: "Matematika 2", votes: 2, voted: true, own: false });
    expect(JSON.stringify(request)).not.toMatch(/arta|besa|user_id/i);
  });

  it("lets a student withdraw their vote", async () => {
    const { env } = setup();
    const { body } = await call(env, "create-request", { user: 1, body: ask });
    const vote = await call(env, "vote-request", { user: 2, body: { id: body.id } });
    expect(vote.body.votes).toBe(2);
    const unvote = await call(env, "vote-request", { user: 2, body: { id: body.id, vote: false } });
    expect(unvote.body).toMatchObject({ voted: false, votes: 1 });
  });

  it("validates what is asked for", async () => {
    const { env } = setup();
    expect((await call(env, "create-request", { user: 1, body: { ...ask, faculty: "NOPE" } })).status).toBe(400);
    expect((await call(env, "create-request", { user: 1, body: { ...ask, type: "Gazetë" } })).status).toBe(400);
    expect((await call(env, "create-request", { user: 1, body: { ...ask, details: "<script>" } })).status).toBe(400);
    expect((await call(env, "create-request", { body: ask })).status).toBe(401);
  });

  it("can be withdrawn by its author or removed by the moderator, nobody else", async () => {
    const { env } = setup();
    const { body } = await call(env, "create-request", { user: 1, body: ask });
    expect((await call(env, "remove-request", { user: 2, body: { id: body.id } })).status).toBe(404);
    expect((await call(env, "remove-request", { user: 3, body: { id: body.id } })).status).toBe(200);
    expect((await call(env, "requests", { method: "GET" })).body.requests).toHaveLength(0);
  });

  it("is fulfilled when an answering material is approved, and everyone who asked is emailed", async () => {
    const { env, db } = setup();
    const { body } = await call(env, "create-request", { user: 1, body: ask });
    await call(env, "vote-request", { user: 2, body: { id: body.id } });
    db.raw.exec(`INSERT INTO materials (id, user_id, title, university, faculty, subject, type, file_key, file_type, r2_url, status, request_id)
      VALUES (50, 2, 'Matematika 2 - Afatet 2025', '${UP}', 'FIEK', 'Matematika 2', 'Afat', 'k50', 'pdf', 'https://media.e-studenti.com/k50', 'pending', ${body.id})`);

    const review = await call(env, "review-material", { user: 3, body: { id: 50, decision: "approve" } });
    expect(review.status).toBe(200);

    const fulfilled = await call(env, "requests", { method: "GET", query: "&status=fulfilled" });
    expect(fulfilled.body.requests[0]).toMatchObject({ status: "fulfilled", material_slug: expect.any(String) });
    const toRequesters = emails.filter((email) => /kërkuat/.test(email.subject));
    expect(toRequesters.map((email) => email.to).sort()).toEqual(["arta@gmail.com", "besa@gmail.com"]);
    expect(toRequesters[0].html).toContain(`/materialet/${fulfilled.body.requests[0].material_slug}`);

    // Fulfilment happens once, even if the material is approved again later.
    expect((await fulfillRequestForMaterial(env, 50)).fulfilled).toBe(false);
  });
});

describe("subject follows and the weekly digest", () => {
  const MONDAY_9 = new Date("2026-11-02T09:00:00Z");
  const slug = "elektronika-fiek";

  it("only follows subjects that exist", async () => {
    const { env } = setup();
    expect((await call(env, "follow-subject", { user: 1, body: { slug: "nuk-ekziston-fiek" } })).status).toBe(404);
    expect((await call(env, "follow-subject", { user: 1, body: { slug } })).body.following).toBe(true);
    const mine = await call(env, "my-follows", { method: "GET", user: 1 });
    expect(mine.body.follows).toEqual([expect.objectContaining({ slug, name: "Elektronika" })]);
  });

  it("emails followers once a week with what is new, with a working unsubscribe link", async () => {
    const { env, db } = setup();
    await call(env, "follow-subject", { user: 1, body: { slug } });
    db.raw.exec(`INSERT INTO materials (user_id, title, university, faculty, subject, type, file_key, file_type, r2_url, status, created_at)
      VALUES (2, 'Elektronika - Shënime', '${UP}', 'FIEK', 'Elektronika', 'Shënime', 'k2', 'pdf', 'https://media.e-studenti.com/k2', 'approved', '2026-10-30 12:00:00')`);

    expect((await sendSubjectDigest(env, new Date("2026-11-03T09:00:00Z"))).reason).toBe("not_due");
    expect((await sendSubjectDigest(env, MONDAY_9)).sent).toBe(1);
    expect(emails).toHaveLength(1);
    expect(emails[0].to).toBe("arta@gmail.com");
    expect(emails[0].html).toContain("Elektronika - Shënime");
    expect(emails[0].html).not.toContain("Afatet e Elektronikës"); // from before the window

    expect((await sendSubjectDigest(env, new Date("2026-11-02T10:00:00Z"))).reason).toBe("already_sent");

    const link = new URL(emails[0].html.match(/href="([^"]+ndjekjet[^"]+)"/)[1].replace(/&amp;/g, "&"));
    const forged = await call(env, "unsubscribe-digest", { body: { u: 1, s: "0".repeat(32) } });
    expect(forged.status).toBe(400);
    const real = await call(env, "unsubscribe-digest", {
      body: { u: link.searchParams.get("u"), s: link.searchParams.get("s") },
    });
    expect(real.body.removed).toBe(1);
  });

  it("sends nothing when nothing new was published", async () => {
    const { env } = setup();
    await call(env, "follow-subject", { user: 1, body: { slug } });
    expect((await sendSubjectDigest(env, MONDAY_9)).reason).toBe("nothing_new");
    expect(emails).toHaveLength(0);
  });
});

describe("account data", () => {
  it("export includes requests and follows; deletion removes follows and votes", async () => {
    const { env, db } = setup();
    const { body } = await call(env, "create-request", { user: 2, body: ask });
    await call(env, "follow-subject", { user: 2, body: { slug: "elektronika-fiek" } });

    const exported = await worker.fetch(
      new Request("https://api.e-studenti.com/?action=export-account", {
        headers: { Origin: "http://localhost:3000", Cookie: `srh_token=${await token(2)}` },
      }),
      env
    );
    const data = await exported.json();
    expect(data.material_requests).toHaveLength(1);
    expect(data.followed_subjects).toEqual([expect.objectContaining({ subject_slug: "elektronika-fiek" })]);

    const deleted = await call(env, "delete-account", { user: 2, body: { confirm_email: "besa@gmail.com" } });
    expect(deleted.status).toBe(200);
    const count = (sql) => db.raw.prepare(sql).get(2).n;
    expect(count("SELECT COUNT(*) AS n FROM subject_follows WHERE user_id = ?")).toBe(0);
    expect(count("SELECT COUNT(*) AS n FROM material_request_votes WHERE user_id = ?")).toBe(0);
    expect(db.raw.prepare("SELECT status FROM material_requests WHERE id = ?").get(body.id).status).toBe("removed");
  });
});
