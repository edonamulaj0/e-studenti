/**
 * AWS Signature Version 4 presigning for R2's S3-compatible API.
 *
 * Written against Web Crypto rather than pulled from @aws-sdk: the signing
 * algorithm is about eighty lines, and the SDK is a large dependency to carry
 * into a Worker for one function.
 *
 * A presigned URL is a capability. Whoever holds it may perform exactly the
 * request it was signed for, until it expires. Everything that constrains it —
 * the bucket, the key, the method, the expiry, and the exact body size — is
 * baked into the signature, so none of it can be altered by the holder without
 * invalidating it.
 */

const ALGORITHM = "AWS4-HMAC-SHA256";
/** R2 has no regions; its S3 API expects this literal. */
const REGION = "auto";
const SERVICE = "s3";

const encoder = new TextEncoder();

/**
 * RFC 3986 percent-encoding. encodeURIComponent leaves !'()* alone, and SigV4
 * requires them encoded — a key containing an apostrophe would otherwise sign
 * differently from how the server canonicalises it.
 */
function encodeRfc3986(value) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

/** Encodes a path, leaving separators intact: S3 signs "/" literally. */
function encodePath(path) {
  return path.split("/").map(encodeRfc3986).join("/");
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value) {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

async function hmac(key, value) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value));
}

/** The date-scoped signing key: secret → date → region → service → request. */
async function signingKey(secretAccessKey, dateStamp) {
  let key = encoder.encode(`AWS4${secretAccessKey}`);
  for (const part of [dateStamp, REGION, SERVICE, "aws4_request"]) {
    key = new Uint8Array(await hmac(key, part));
  }
  return key;
}

/** SigV4 timestamps: 20240115T103000Z and 20240115. */
export function amzDates(now = new Date()) {
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzDate, dateStamp: amzDate.slice(0, 8) };
}

/**
 * Presigns a single-object request against R2's S3 endpoint.
 *
 * `contentLength`, when given, is signed as a header rather than left to the
 * client. The browser sets Content-Length from the body it actually sends, so a
 * body of any other size produces a different signature and R2 rejects it —
 * which is what stops a request declared as 12MB from arriving as 5GB. It is a
 * first line of defence, not the only one: the size is checked again against
 * the stored object at commit.
 */
export async function presignR2Url({
  accountId,
  accessKeyId,
  secretAccessKey,
  bucket,
  key,
  method = "PUT",
  expiresIn = 900,
  contentLength,
  now = new Date(),
}) {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials are not configured");
  }
  if (!bucket || !key) {
    throw new Error("bucket and key are required");
  }
  if (!Number.isInteger(expiresIn) || expiresIn < 1 || expiresIn > 604800) {
    throw new Error("expiresIn must be between 1 and 604800 seconds");
  }

  const host = `${accountId}.r2.cloudflarestorage.com`;
  const { amzDate, dateStamp } = amzDates(now);
  const scope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const canonicalUri = `/${encodePath(bucket)}/${encodePath(key)}`;

  // Only the headers named here are signed, and the client must reproduce them
  // exactly. Host is mandatory; content-length pins the body size when known.
  const headers = { host };
  if (contentLength !== undefined) {
    if (!Number.isInteger(contentLength) || contentLength < 0) {
      throw new Error("contentLength must be a non-negative integer");
    }
    headers["content-length"] = String(contentLength);
  }
  const signedHeaders = Object.keys(headers).sort();
  const canonicalHeaders = `${signedHeaders.map((h) => `${h}:${headers[h]}`).join("\n")}\n`;
  const signedHeadersValue = signedHeaders.join(";");

  const query = {
    "X-Amz-Algorithm": ALGORITHM,
    "X-Amz-Credential": `${accessKeyId}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresIn),
    "X-Amz-SignedHeaders": signedHeadersValue,
  };
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((name) => `${encodeRfc3986(name)}=${encodeRfc3986(query[name])}`)
    .join("&");

  // The body is not hashed: the client holds it, not us. UNSIGNED-PAYLOAD is
  // the standard marker for that, and content-length is what bounds it instead.
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeadersValue,
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    ALGORITHM,
    amzDate,
    scope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const signature = toHex(
    await hmac(await signingKey(secretAccessKey, dateStamp), stringToSign)
  );

  return {
    url: `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`,
    /** Headers the client must send verbatim for the signature to verify. */
    requiredHeaders: contentLength === undefined ? {} : { "Content-Length": String(contentLength) },
    expiresAt: new Date(now.getTime() + expiresIn * 1000).toISOString(),
  };
}

/** True when the worker has everything it needs to presign. */
export function hasR2Credentials(env) {
  return Boolean(env?.R2_ACCOUNT_ID && env?.R2_ACCESS_KEY_ID && env?.R2_SECRET_ACCESS_KEY);
}
