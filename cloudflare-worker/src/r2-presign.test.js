import { describe, expect, it } from "vitest";

import { amzDates, hasR2Credentials, presignR2Url } from "./r2-presign.js";

/**
 * The expected signatures below come from a second, independent implementation
 * written directly from the AWS SigV4 spec in Python (hmac/hashlib), not from
 * this module. Agreement between two implementations that share no code is what
 * makes these vectors meaningful — R2 itself cannot be reached from CI, and a
 * signature checked only against the code that produced it proves nothing.
 */
const CREDS = {
  accountId: "abc123account",
  accessKeyId: "AKIAIOSFODNN7EXAMPLE",
  secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  bucket: "e-studenti-uploads",
};
const AT = new Date("2024-01-15T10:30:00.000Z");

function signatureOf(url) {
  return new URL(url).searchParams.get("X-Amz-Signature");
}

describe("R2 presigning", () => {
  it("matches the reference signature for a plain PUT", async () => {
    const { url } = await presignR2Url({
      ...CREDS,
      key: "pending/7/9f2c/ligjerata.pdf",
      method: "PUT",
      expiresIn: 900,
      now: AT,
    });

    expect(signatureOf(url)).toBe(
      "de6e47444f135c0d2d59772dcba1f19a60a4aec9446c5415f541fa8c3055372a"
    );
    expect(url.startsWith("https://abc123account.r2.cloudflarestorage.com/")).toBe(true);
  });

  it("matches the reference signature when content-length is pinned", async () => {
    const { url, requiredHeaders } = await presignR2Url({
      ...CREDS,
      key: "pending/7/9f2c/ligjerata.pdf",
      method: "PUT",
      expiresIn: 900,
      contentLength: 12582912,
      now: AT,
    });

    expect(signatureOf(url)).toBe(
      "f19f8587af2144c19b0cd76649d59f3dae39fabf341c1209d75b18166e96d166"
    );
    // The size only binds if the client is told to send it.
    expect(requiredHeaders).toEqual({ "Content-Length": "12582912" });
    expect(new URL(url).searchParams.get("X-Amz-SignedHeaders")).toBe("content-length;host");
  });

  it("matches the reference signature for a key needing RFC 3986 escaping", async () => {
    const { url } = await presignR2Url({
      ...CREDS,
      key: "pending/7/a b'c(1)*.pdf",
      method: "PUT",
      expiresIn: 900,
      now: AT,
    });

    expect(signatureOf(url)).toBe(
      "bef5df170b8ba96ab5caf7ce54e2b578810b2012171711c3dca3b2ddb01a62d8"
    );
  });

  it("matches the reference signature for a GET", async () => {
    const { url } = await presignR2Url({
      ...CREDS,
      key: "pending/7/9f2c/ligjerata.pdf",
      method: "GET",
      expiresIn: 300,
      now: AT,
    });

    expect(signatureOf(url)).toBe(
      "fd2ba68f07e472a0b0146e2bd9ae76cf4c4bc3b3db3f4d95de0e48051de9c538"
    );
  });

  it("signs the key it was given, so one URL cannot be aimed at another object", async () => {
    const mine = await presignR2Url({ ...CREDS, key: "pending/7/a.pdf", now: AT });
    const theirs = await presignR2Url({ ...CREDS, key: "pending/8/a.pdf", now: AT });

    expect(signatureOf(mine.url)).not.toBe(signatureOf(theirs.url));
    // And the path is fixed in the URL, not a parameter the holder can vary.
    expect(new URL(mine.url).pathname).toBe("/e-studenti-uploads/pending/7/a.pdf");
  });

  it("produces a different signature for a different declared size", async () => {
    const small = await presignR2Url({ ...CREDS, key: "a.pdf", contentLength: 1000, now: AT });
    const large = await presignR2Url({ ...CREDS, key: "a.pdf", contentLength: 5_000_000_000, now: AT });

    expect(signatureOf(small.url)).not.toBe(signatureOf(large.url));
  });

  it("carries the expiry in the URL and reports when it lapses", async () => {
    const { url, expiresAt } = await presignR2Url({
      ...CREDS,
      key: "a.pdf",
      expiresIn: 900,
      now: AT,
    });

    expect(new URL(url).searchParams.get("X-Amz-Expires")).toBe("900");
    expect(expiresAt).toBe("2024-01-15T10:45:00.000Z");
  });

  it("refuses to sign without credentials", async () => {
    await expect(
      presignR2Url({ accountId: "", accessKeyId: "", secretAccessKey: "", bucket: "b", key: "k" })
    ).rejects.toThrow(/credentials/i);
  });

  it("rejects an expiry outside the range S3 accepts", async () => {
    await expect(
      presignR2Url({ ...CREDS, key: "a.pdf", expiresIn: 0 })
    ).rejects.toThrow(/expiresIn/);
    await expect(
      presignR2Url({ ...CREDS, key: "a.pdf", expiresIn: 604801 })
    ).rejects.toThrow(/expiresIn/);
  });

  it("rejects a nonsensical content length", async () => {
    await expect(
      presignR2Url({ ...CREDS, key: "a.pdf", contentLength: -1 })
    ).rejects.toThrow(/contentLength/);
    await expect(
      presignR2Url({ ...CREDS, key: "a.pdf", contentLength: 1.5 })
    ).rejects.toThrow(/contentLength/);
  });

  it("formats SigV4 timestamps", () => {
    expect(amzDates(AT)).toEqual({ amzDate: "20240115T103000Z", dateStamp: "20240115" });
  });

  it("reports whether the worker is configured to presign", () => {
    expect(hasR2Credentials({})).toBe(false);
    expect(hasR2Credentials({ R2_ACCOUNT_ID: "a", R2_ACCESS_KEY_ID: "b" })).toBe(false);
    expect(
      hasR2Credentials({ R2_ACCOUNT_ID: "a", R2_ACCESS_KEY_ID: "b", R2_SECRET_ACCESS_KEY: "c" })
    ).toBe(true);
  });
});
