/**
 * The parts of WebAuthn (passkeys) the moderator's second factor needs, with no
 * dependencies: registration with "none" attestation and ES256 (P-256) keys,
 * which every platform authenticator and security key supports, and
 * verification of sign-in assertions with Web Crypto.
 *
 * Spec: https://www.w3.org/TR/webauthn-2/ — §7.1 (registration), §7.2 (assertion).
 */

const encoder = new TextEncoder();

export function base64UrlToBytes(value) {
  const base64 = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

export function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function randomChallenge() {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

/**
 * Minimal CBOR decoder (RFC 8949) for attestation objects and COSE keys:
 * integers, byte and text strings, arrays, maps, and simple values.
 * Returns the value and the offset just past it.
 */
export function decodeCbor(bytes, offset = 0) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const initial = bytes[offset];
  if (initial === undefined) throw new Error("CBOR: unexpected end");
  const major = initial >> 5;
  const info = initial & 0x1f;
  let pos = offset + 1;
  let length;
  if (info < 24) length = info;
  else if (info === 24) length = bytes[pos++];
  else if (info === 25) (length = view.getUint16(pos)), (pos += 2);
  else if (info === 26) (length = view.getUint32(pos)), (pos += 4);
  else if (info === 27) (length = Number(view.getBigUint64(pos))), (pos += 8);
  else throw new Error("CBOR: indefinite lengths are not supported");

  switch (major) {
    case 0:
      return { value: length, offset: pos };
    case 1:
      return { value: -1 - length, offset: pos };
    case 2:
      if (pos + length > bytes.length) throw new Error("CBOR: truncated bytes");
      return { value: bytes.slice(pos, pos + length), offset: pos + length };
    case 3:
      if (pos + length > bytes.length) throw new Error("CBOR: truncated text");
      return { value: new TextDecoder().decode(bytes.slice(pos, pos + length)), offset: pos + length };
    case 4: {
      const items = [];
      for (let i = 0; i < length; i += 1) {
        const item = decodeCbor(bytes, pos);
        items.push(item.value);
        pos = item.offset;
      }
      return { value: items, offset: pos };
    }
    case 5: {
      const map = new Map();
      for (let i = 0; i < length; i += 1) {
        const key = decodeCbor(bytes, pos);
        const value = decodeCbor(bytes, key.offset);
        map.set(key.value, value.value);
        pos = value.offset;
      }
      return { value: map, offset: pos };
    }
    case 7:
      if (info === 20) return { value: false, offset: pos };
      if (info === 21) return { value: true, offset: pos };
      if (info === 22) return { value: null, offset: pos };
      throw new Error("CBOR: unsupported simple value");
    default:
      throw new Error("CBOR: unsupported type");
  }
}

const FLAG_USER_PRESENT = 0x01;
const FLAG_USER_VERIFIED = 0x04;
const FLAG_ATTESTED_DATA = 0x40;

/** Authenticator data (§6.1): rpIdHash, flags, signCount and, on registration, the new credential. */
export function parseAuthenticatorData(bytes) {
  if (bytes.length < 37) throw new Error("authenticator data too short");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const flags = bytes[32];
  const result = {
    rpIdHash: bytes.slice(0, 32),
    flags,
    userPresent: Boolean(flags & FLAG_USER_PRESENT),
    userVerified: Boolean(flags & FLAG_USER_VERIFIED),
    signCount: view.getUint32(33),
  };
  if (flags & FLAG_ATTESTED_DATA) {
    const idLength = view.getUint16(53);
    const credentialId = bytes.slice(55, 55 + idLength);
    const key = decodeCbor(bytes, 55 + idLength);
    result.credentialId = credentialId;
    result.credentialPublicKey = key.value;
  }
  return result;
}

/** A COSE EC2 P-256 ES256 key (kty 2, alg -7, crv 1) as a JWK; anything else is refused. */
export function coseToJwk(cose) {
  if (!(cose instanceof Map)) throw new Error("credential key is not a COSE map");
  if (cose.get(1) !== 2 || cose.get(3) !== -7 || cose.get(-1) !== 1) {
    throw new Error("only ES256 (P-256) passkeys are supported");
  }
  const x = cose.get(-2);
  const y = cose.get(-3);
  if (!(x instanceof Uint8Array) || !(y instanceof Uint8Array) || x.length !== 32 || y.length !== 32) {
    throw new Error("malformed P-256 key");
  }
  return { kty: "EC", crv: "P-256", x: bytesToBase64Url(x), y: bytesToBase64Url(y) };
}

/** ECDSA signatures arrive DER-encoded; Web Crypto wants r || s, 32 bytes each. */
export function derToRawSignature(der) {
  let pos = 0;
  if (der[pos++] !== 0x30) throw new Error("signature is not a DER sequence");
  if (der[pos] & 0x80) pos += 1 + (der[pos] & 0x7f);
  else pos += 1;
  const readInteger = () => {
    if (der[pos++] !== 0x02) throw new Error("signature integer expected");
    const length = der[pos++];
    let value = der.slice(pos, pos + length);
    pos += length;
    while (value.length > 32 && value[0] === 0) value = value.slice(1);
    if (value.length > 32) throw new Error("signature integer too long");
    const padded = new Uint8Array(32);
    padded.set(value, 32 - value.length);
    return padded;
  };
  const raw = new Uint8Array(64);
  raw.set(readInteger(), 0);
  raw.set(readInteger(), 32);
  return raw;
}

async function sha256(bytes) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Checks clientDataJSON (§7.1 steps 7–12, §7.2 steps 11–15) and returns it parsed. */
function checkClientData(clientDataBytes, { type, challenge, origins }) {
  let clientData;
  try {
    clientData = JSON.parse(new TextDecoder().decode(clientDataBytes));
  } catch {
    throw new Error("client data is not JSON");
  }
  if (clientData.type !== type) throw new Error(`expected ${type}`);
  if (clientData.challenge !== challenge) throw new Error("challenge does not match");
  if (!origins.includes(clientData.origin)) throw new Error("origin not allowed");
  return clientData;
}

/** The challenge a client data blob claims to answer, read before anything is trusted. */
export function challengeOf(clientDataJSON) {
  try {
    return JSON.parse(new TextDecoder().decode(base64UrlToBytes(clientDataJSON))).challenge || null;
  } catch {
    return null;
  }
}

/**
 * Verifies a registration response. Returns the credential to store:
 * { credentialId (base64url), jwk, signCount }.
 */
export async function verifyRegistration(response, { challenge, origins, rpId }) {
  const clientDataBytes = base64UrlToBytes(response.clientDataJSON);
  checkClientData(clientDataBytes, { type: "webauthn.create", challenge, origins });
  const attestation = decodeCbor(base64UrlToBytes(response.attestationObject)).value;
  if (!(attestation instanceof Map) || !(attestation.get("authData") instanceof Uint8Array)) {
    throw new Error("malformed attestation object");
  }
  const authData = parseAuthenticatorData(attestation.get("authData"));
  if (!sameBytes(authData.rpIdHash, await sha256(encoder.encode(rpId)))) throw new Error("passkey is for another site");
  if (!authData.userPresent || !authData.userVerified) throw new Error("user verification required");
  if (!authData.credentialId) throw new Error("no credential in the response");
  const jwk = coseToJwk(authData.credentialPublicKey);
  return { credentialId: bytesToBase64Url(authData.credentialId), jwk, signCount: authData.signCount };
}

/**
 * Verifies a sign-in assertion against a stored credential. Returns the new
 * signature counter.
 */
export async function verifyAssertion(response, { challenge, origins, rpId, jwk, signCount }) {
  const clientDataBytes = base64UrlToBytes(response.clientDataJSON);
  checkClientData(clientDataBytes, { type: "webauthn.get", challenge, origins });
  const authDataBytes = base64UrlToBytes(response.authenticatorData);
  const authData = parseAuthenticatorData(authDataBytes);
  if (!sameBytes(authData.rpIdHash, await sha256(encoder.encode(rpId)))) throw new Error("passkey is for another site");
  if (!authData.userPresent || !authData.userVerified) throw new Error("user verification required");

  const signed = new Uint8Array(authDataBytes.length + 32);
  signed.set(authDataBytes, 0);
  signed.set(await sha256(clientDataBytes), authDataBytes.length);
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    derToRawSignature(base64UrlToBytes(response.signature)),
    signed
  );
  if (!valid) throw new Error("signature does not verify");
  // A counter that goes backwards means a cloned authenticator. Synced passkeys
  // report 0 every time, which is allowed.
  if (authData.signCount !== 0 || signCount !== 0) {
    if (authData.signCount <= signCount) throw new Error("signature counter went backwards");
  }
  return { signCount: authData.signCount };
}
