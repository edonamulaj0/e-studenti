import { describe, expect, it } from "vitest";
import worker from "./index.js";

const JWT_SECRET = "test-secret-test-secret-test-secret";
const encoder = new TextEncoder();

function base64Url(bytes) {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function signedToken() {
  const now = Math.floor(Date.now() / 1000);
  const data = `${base64Url(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })))}.${base64Url(
    encoder.encode(
      JSON.stringify({
        sub: 1,
        email: "mod@example.com",
        iat: now,
        exp: now + 3600,
        iss: "https://e-studenti.com",
        aud: "https://e-studenti.com",
        tv: 0,
      })
    )
  )}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return `${data}.${base64Url(new Uint8Array(signature))}`;
}

/** One row of each shape the moderation list has to explain. */
const ROWS = [
  {
    id: 1,
    title: "Kapitulli 4",
    file_type: "pdf",
    uploader_id: 2,
    uploader_name: "Eriona",
    uploader_email: "eriona@example.com",
    pending_owner_email: null,
  },
  {
    id: 2,
    title: "Literatura - Elektronikë (RAR)",
    file_type: "rar",
    uploader_id: 2,
    uploader_name: "Eriona",
    uploader_email: "eriona@example.com",
    pending_owner_email: null,
  },
  {
    id: 3,
    title: "Material i pareklamuar",
    file_type: "pdf",
    uploader_id: null,
    uploader_name: null,
    uploader_email: null,
    pending_owner_email: "legacy@example.com",
  },
];

function makeEnv() {
  const db = {
    prepare(sql) {
      const statement = {
        bind: () => statement,
        async run() {
          return { meta: { changes: 1 } };
        },
        async first() {
          if (/FROM users WHERE id/.test(sql)) {
            return {
              id: 1,
              email: "mod@example.com",
              name: "Moderatori",
              token_version: 0,
              is_moderator: 1,
            };
          }
          if (/public_total/.test(sql)) return { total: 78, public_total: 61 };
          return null;
        },
        async all() {
          if (/LIMIT \? OFFSET \?/.test(sql)) return { results: ROWS };
          return { results: [] };
        },
      };
      return statement;
    },
  };
  return { DB: db, ENVIRONMENT: "development", JWT_SECRET };
}

async function moderatorMaterials(env) {
  const request = new Request("https://api.e-studenti.com/?action=moderator-materials", {
    headers: {
      Origin: "https://e-studenti.com",
      Cookie: `srh_token=${await signedToken()}`,
    },
  });
  const response = await worker.fetch(request, env);
  return { response, body: await response.json() };
}

describe("moderator materials visibility", () => {
  it("reports how many of the moderated materials are public", async () => {
    const { response, body } = await moderatorMaterials(makeEnv());

    expect(response.status).toBe(200);
    expect(body.total).toBe(78);
    expect(body.publicTotal).toBe(61);
    expect(body.hiddenTotal).toBe(17);
  });

  it("labels why each hidden material is missing from the catalog", async () => {
    const { body } = await moderatorMaterials(makeEnv());
    const byId = Object.fromEntries(body.materials.map((m) => [m.id, m]));

    expect(byId[1].hidden_reason).toBeNull();
    expect(byId[2].hidden_reason).toBe("rar");
    expect(byId[3].hidden_reason).toBe("no_owner");
  });

  it("does not leak the raw uploader id", async () => {
    const { body } = await moderatorMaterials(makeEnv());
    for (const material of body.materials) {
      expect(material).not.toHaveProperty("uploader_id");
    }
  });
});
