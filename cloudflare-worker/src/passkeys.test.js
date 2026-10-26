import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "./index.js";
import { MODERATOR_EMAIL } from "./moderators.js";
import { createTestD1 } from "./test-d1.js";
import { base64UrlToBytes, bytesToBase64Url, decodeCbor, derToRawSignature } from "./webauthn.js";

const JWT_SECRET = "test-secret-test-secret-test-secret";
const ORIGIN = "http://localhost:3000";
const enc = new TextEncoder();

// ── A software authenticator ──────────────────────────────────────────────

function cbor(value) {
  const head = (major, n) =>
    n < 24 ? [(major << 5) | n] : n < 256 ? [(major << 5) | 24, n] : [(major << 5) | 25, n >> 8, n & 255];
  if (typeof value === "number") return value >= 0 ? head(0, value) : head(1, -1 - value);
  if (typeof value === "string") {
    const bytes = [...enc.encode(value)];
    return [...head(3, bytes.length), ...bytes];
  }
  if (value instanceof Uint8Array) return [...head(2, value.length), ...value];
  if (value instanceof Map) {
    const out = head(5, value.size);
    for (const [k, v] of value) out.push(...cbor(k), ...cbor(v));
    return out;
  }
  throw new Error("unsupported");
}

/** IEEE P1363 (r||s, what Web Crypto produces) to DER (what authenticators send). */
function rawToDer(raw) {
  const integer = (bytes) => {
    let b = [...bytes];
    while (b.length > 1 && b[0] === 0 && b[1] < 0x80) b = b.slice(1);
    if (b[0] >= 0x80) b = [0, ...b];
    return [0x02, b.length, ...b];
  };
  const body = [...integer(raw.slice(0, 32)), ...integer(raw.slice(32))];
  return new Uint8Array([0x30, body.length, ...body]);
}

const sha256 = async (bytes) => new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));

async function authenticator(rpId = "localhost") {
  const keys = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const jwk = await crypto.subtle.exportKey("jwk", keys.publicKey);
  const credentialId = crypto.getRandomValues(new Uint8Array(16));
  let counter = 0;
  const authData = async (extra = []) => {
    counter += 1;
    const flags = 0x01 | 0x04 | (extra.length ? 0x40 : 0);
    return new Uint8Array([...(await sha256(enc.encode(rpId))), flags, 0, 0, 0, counter, ...extra]);
  };
  const clientData = (type, challenge, origin = ORIGIN) =>
    enc.encode(JSON.stringify({ type, challenge, origin, crossOrigin: false }));
  return {
    id: bytesToBase64Url(credentialId),
    async create(challenge) {
      const cose = new Map([
        [1, 2],
        [3, -7],
        [-1, 1],
        [-2, base64UrlToBytes(jwk.x)],
        [-3, base64UrlToBytes(jwk.y)],
      ]);
      const attested = [...new Uint8Array(16), 0, credentialId.length, ...credentialId, ...cbor(cose)];
      const attestation = new Map([
        ["fmt", "none"],
        ["attStmt", new Map()],
        ["authData", await authData(attested)],
      ]);
      return {
        id: bytesToBase64Url(credentialId),
        response: {
          clientDataJSON: bytesToBase64Url(clientData("webauthn.create", challenge)),
          attestationObject: bytesToBase64Url(new Uint8Array(cbor(attestation))),
        },
      };
    },
    async get(challenge, { origin } = {}) {
      const data = await authData();
      const client = clientData("webauthn.get", challenge, origin);
      const signed = new Uint8Array([...data, ...(await sha256(client))]);
      const raw = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, keys.privateKey, signed));
      return {
        id: bytesToBase64Url(credentialId),
        response: {
          clientDataJSON: bytesToBase64Url(client),
          authenticatorData: bytesToBase64Url(data),
          signature: bytesToBase64Url(rawToDer(raw)),
        },
      };
    },
  };
}

// ── The app ───────────────────────────────────────────────────────────────

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
  db.raw.exec(`INSERT INTO users (id, name, surname, email, email_verified) VALUES
    (3, 'M', 'M', '${MODERATOR_EMAIL}', 1), (1, 'Arta', 'A', 'arta@gmail.com', 1)`);
  return { db, env: { DB: db, ENVIRONMENT: "development", JWT_SECRET } };
}

async function post(env, action, body, user) {
  const headers = { Origin: ORIGIN, "Content-Type": "application/json" };
  if (user) headers.Cookie = `srh_token=${await token(user)}`;
  const response = await worker.fetch(
    new Request(`https://api.e-studenti.com/?action=${action}`, { method: "POST", headers, body: JSON.stringify(body) }),
    env
  );
  return { status: response.status, cookie: response.headers.get("Set-Cookie"), body: await response.json() };
}

/** Email-code sign-in; the code is read from the dev-mode email printout. */
async function signInWithCode(env, email) {
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  await post(env, "login", { email });
  const code = log.mock.calls.map((c) => String(c[0])).join("\n").match(/\b(\d{8})\b/)[1];
  log.mockRestore();
  return post(env, "verify", { email, code });
}

async function registerPasskey(env, key) {
  const options = await post(env, "passkey-register-options", {}, 3);
  expect(options.body.rp.id).toBe("localhost");
  return post(env, "passkey-register", { name: "Laptop", ...(await key.create(options.body.challenge)) }, 3);
}

afterEach(() => vi.restoreAllMocks());

describe("moderator passkeys", () => {
  it("are optional until one is registered", async () => {
    const { env } = setup();
    const result = await signInWithCode(env, MODERATOR_EMAIL);
    expect(result.cookie).toMatch(/^srh_token=/);
    expect(result.body.passkey_required).toBeUndefined();
  });

  it("make the emailed code alone insufficient, and finish sign-in with the passkey", async () => {
    const { env } = setup();
    const key = await authenticator();
    expect((await registerPasskey(env, key)).body.success).toBe(true);

    const first = await signInWithCode(env, MODERATOR_EMAIL);
    expect(first.cookie).toBeNull();
    expect(first.body).toMatchObject({ passkey_required: true });
    expect(first.body.passkey.allowCredentials).toEqual([{ type: "public-key", id: key.id }]);

    const second = await post(env, "passkey-login", await key.get(first.body.passkey.challenge));
    expect(second.status).toBe(200);
    expect(second.cookie).toMatch(/^srh_token=/);
    expect(second.body.user.is_moderator).toBe(true);
  });

  it("refuse another key, a replayed challenge, and a passkey for another site", async () => {
    const { env } = setup();
    const key = await authenticator();
    await registerPasskey(env, key);

    const { body } = await signInWithCode(env, MODERATOR_EMAIL);
    const stranger = await authenticator();
    expect((await post(env, "passkey-login", { ...(await stranger.get(body.passkey.challenge)), id: key.id })).status).toBe(400);

    // The failed attempt consumed the challenge, so even the right key cannot reuse it.
    expect((await post(env, "passkey-login", await key.get(body.passkey.challenge))).status).toBe(400);

    const again = await signInWithCode(env, MODERATOR_EMAIL);
    const phishing = await authenticator("evil.example");
    await expect(
      post(env, "passkey-login", { ...(await phishing.get(again.body.passkey.challenge)), id: key.id })
    ).resolves.toMatchObject({ status: 400 });
    const wrongOrigin = await key.get(again.body.passkey.challenge, { origin: "https://evil.example" });
    expect((await post(env, "passkey-login", wrongOrigin)).status).toBe(400);
  });

  it("refuse a tampered signature even when everything else is valid", async () => {
    const { env } = setup();
    const key = await authenticator();
    await registerPasskey(env, key);
    const { body } = await signInWithCode(env, MODERATOR_EMAIL);
    const assertion = await key.get(body.passkey.challenge); // counter moves forward: only the signature is wrong
    const signature = base64UrlToBytes(assertion.response.signature);
    signature[signature.length - 1] ^= 0x01;
    assertion.response.signature = bytesToBase64Url(signature);
    const result = await post(env, "passkey-login", assertion);
    expect(result.status).toBe(400);
    expect(result.cookie).toBeNull();
  });

  it("do not affect other accounts", async () => {
    const { env } = setup();
    await registerPasskey(env, await authenticator());
    const student = await signInWithCode(env, "arta@gmail.com");
    expect(student.cookie).toMatch(/^srh_token=/);
    expect((await post(env, "passkey-register-options", {}, 1)).status).toBe(401);
  });

  it("can be listed and removed by the moderator", async () => {
    const { env } = setup();
    await registerPasskey(env, await authenticator());
    const list = await worker.fetch(
      new Request("https://api.e-studenti.com/?action=passkeys", {
        headers: { Origin: ORIGIN, Cookie: `srh_token=${await token(3)}` },
      }),
      env
    );
    const { passkeys } = await list.json();
    expect(passkeys).toEqual([expect.objectContaining({ name: "Laptop" })]);
    expect((await post(env, "delete-passkey", { id: passkeys[0].id }, 3)).body.success).toBe(true);
    expect((await signInWithCode(env, MODERATOR_EMAIL)).cookie).toMatch(/^srh_token=/);
  });
});

describe("webauthn helpers", () => {
  it("decode CBOR and convert DER signatures", () => {
    expect(decodeCbor(new Uint8Array(cbor(new Map([["a", -7]])))).value).toEqual(new Map([["a", -7]]));
    const raw = new Uint8Array(64).fill(1);
    raw[0] = 0x80; // forces a leading zero in DER
    expect(derToRawSignature(rawToDer(raw))).toEqual(raw);
  });
});
