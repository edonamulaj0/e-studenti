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

/** An R2 bucket in memory: enough of put/get/delete for these flows. */
function memoryBucket() {
  const objects = new Map();
  return {
    objects,
    async put(key, body, options = {}) {
      const bytes = body instanceof Blob ? new Uint8Array(await body.arrayBuffer()) : new Uint8Array(await new Response(body).arrayBuffer());
      objects.set(key, { bytes, httpMetadata: options.httpMetadata || {} });
    },
    async get(key) {
      const object = objects.get(key);
      return object ? { body: new Blob([object.bytes]).stream(), httpMetadata: object.httpMetadata } : null;
    },
    async delete(key) {
      objects.delete(key);
    },
  };
}

function setup() {
  const db = createTestD1();
  db.raw.exec(`
    INSERT INTO users (id, name, surname, email, email_verified) VALUES
      (1, 'Arta', 'A', 'arta@gmail.com', 1),
      (2, 'Besa', 'B', 'besa@gmail.com', 1),
      (3, 'M', 'M', '${MODERATOR_EMAIL}', 1);
  `);
  const pub = memoryBucket();
  const priv = memoryBucket();
  return { db, pub, priv, env: { DB: db, MY_BUCKET: pub, PENDING_BUCKET: priv, ENVIRONMENT: "development", JWT_SECRET } };
}

const pdf = () => new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 10, 37, 37, 69, 79, 70])], "afat.pdf", { type: "application/pdf" });

async function request(env, action, { user, body, method = "POST", query = "" } = {}) {
  const headers = { Origin: "http://localhost:3000" };
  if (user) headers.Cookie = `srh_token=${await token(user)}`;
  let payload;
  if (body instanceof FormData) payload = body;
  else if (method === "POST") {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body ?? {});
  }
  return worker.fetch(new Request(`https://api.e-studenti.com/?action=${action}${query}`, { method, headers, body: payload }), env);
}

async function uploadAsNewUser(env) {
  const form = new FormData();
  form.append("title", "Afatet e Fizikës");
  form.append("faculty", "FIEK");
  form.append("subject", "Fizika");
  form.append("type", "Afat");
  form.append("file", pdf());
  const response = await request(env, "upload", { user: 1, body: form });
  return response.json();
}

describe("files waiting for review", () => {
  it("are stored privately, not in the public bucket", async () => {
    const { env, db, pub, priv } = setup();
    const result = await uploadAsNewUser(env);
    expect(result.status).toBe("pending");
    expect(pub.objects.size).toBe(0);
    expect(priv.objects.size).toBe(1);
    expect(db.raw.prepare("SELECT storage FROM materials").get().storage).toBe("pending");
  });

  it("are streamed to their owner and the moderator only, inert", async () => {
    const { env } = setup();
    const { material } = await uploadAsNewUser(env);
    const view = (user) => request(env, "view-material", { user, method: "GET", query: `&id=${material.id}` });

    const owner = await view(1);
    expect(owner.status).toBe(200);
    expect(owner.headers.get("Content-Security-Policy")).toMatch(/sandbox/);
    expect(owner.headers.get("Cache-Control")).toMatch(/no-store/);
    expect(new Uint8Array(await owner.arrayBuffer()).slice(0, 4)).toEqual(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
    expect((await view(3)).status).toBe(200);
    expect((await view(2)).status).toBe(404);
    expect((await view(undefined)).status).toBe(404);
  });

  it("move to the public bucket when approved, and back when taken off the site", async () => {
    const { env, db, pub, priv } = setup();
    const { material } = await uploadAsNewUser(env);
    const approve = await request(env, "review-material", { user: 3, body: { id: material.id, decision: "approve" } });
    expect(approve.status).toBe(200);
    expect(pub.objects.size).toBe(1);
    expect(priv.objects.size).toBe(0);
    expect(db.raw.prepare("SELECT storage, status FROM materials").get()).toEqual({ storage: "public", status: "approved" });

    const view = await request(env, "view-material", { method: "GET", query: `&id=${material.id}` });
    expect(view.status).toBe(302);
    expect(view.headers.get("Location")).toMatch(/^https:\/\/media\.e-studenti\.com\/materials\//);

    await request(env, "unpublish-material", { user: 3, body: { id: material.id } });
    expect(pub.objects.size).toBe(0);
    expect(priv.objects.size).toBe(1);
  });

  it("are not published if the file cannot be moved", async () => {
    const { env, db, priv } = setup();
    const { material } = await uploadAsNewUser(env);
    priv.objects.clear();
    const approve = await request(env, "review-material", { user: 3, body: { id: material.id, decision: "approve" } });
    expect(approve.status).toBe(500);
    expect(db.raw.prepare("SELECT status FROM materials").get().status).toBe("pending");
  });

  it("are deleted from the private bucket with their material", async () => {
    const { env, priv } = setup();
    const { material } = await uploadAsNewUser(env);
    expect((await request(env, "delete-material", { user: 1, body: { id: material.id } })).status).toBe(200);
    expect(priv.objects.size).toBe(0);
  });
});
