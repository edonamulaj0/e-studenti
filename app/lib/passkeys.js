import { WORKER_URL } from "./worker-url";

/**
 * Browser side of the moderator's passkey: turning the Worker's JSON options
 * into what navigator.credentials expects, and the credential back into JSON.
 */

function toBytes(base64url) {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

function toBase64Url(buffer) {
  let binary = "";
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function passkeysSupported() {
  return typeof window !== "undefined" && Boolean(window.PublicKeyCredential && navigator.credentials);
}

async function post(action, body) {
  const res = await fetch(`${WORKER_URL}/?action=${action}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Veprimi dështoi.");
  return data;
}

/** A cancelled or timed-out prompt reads better as one sentence than as a DOMException. */
function friendlyError(error) {
  if (error?.name === "NotAllowedError" || error?.name === "AbortError") {
    return new Error("Konfirmimi me passkey u anulua ose skadoi. Provoni përsëri.");
  }
  return error;
}

/**
 * Second step of the moderator's sign-in: asks the device for the passkey and
 * exchanges the assertion for a session. Resolves to the Worker's sign-in data.
 */
export async function completePasskeyLogin(options) {
  if (!passkeysSupported()) throw new Error("Ky shfletues nuk mbështet passkey.");
  /** @type {PublicKeyCredential} */
  let credential;
  try {
    credential = /** @type {PublicKeyCredential} */ (await navigator.credentials.get({
      publicKey: {
        challenge: toBytes(options.challenge),
        rpId: options.rpId,
        timeout: options.timeout,
        userVerification: options.userVerification,
        allowCredentials: (options.allowCredentials || []).map((item) => ({ type: item.type, id: toBytes(item.id) })),
      },
    }));
  } catch (error) {
    throw friendlyError(error);
  }
  const response = /** @type {AuthenticatorAssertionResponse} */ (credential.response);
  return post("passkey-login", {
    id: toBase64Url(credential.rawId),
    response: {
      clientDataJSON: toBase64Url(response.clientDataJSON),
      authenticatorData: toBase64Url(response.authenticatorData),
      signature: toBase64Url(response.signature),
    },
  });
}

/** Creates a passkey on this device for the signed-in moderator. */
export async function registerPasskey(name) {
  if (!passkeysSupported()) throw new Error("Ky shfletues nuk mbështet passkey.");
  const options = await post("passkey-register-options", {});
  /** @type {PublicKeyCredential} */
  let credential;
  try {
    credential = /** @type {PublicKeyCredential} */ (await navigator.credentials.create({
      publicKey: {
        ...options,
        challenge: toBytes(options.challenge),
        user: { ...options.user, id: toBytes(options.user.id) },
        excludeCredentials: (options.excludeCredentials || []).map((item) => ({ type: item.type, id: toBytes(item.id) })),
      },
    }));
  } catch (error) {
    if (error?.name === "InvalidStateError") throw new Error("Kjo pajisje ka tashmë një passkey për llogarinë.");
    throw friendlyError(error);
  }
  return post("passkey-register", {
    name,
    id: toBase64Url(credential.rawId),
    response: {
      clientDataJSON: toBase64Url(credential.response.clientDataJSON),
      attestationObject: toBase64Url(/** @type {AuthenticatorAttestationResponse} */ (credential.response).attestationObject),
    },
  });
}
