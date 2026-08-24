import { describe, expect, it } from "vitest";

import worker, { sweepAbandonedUploads } from "./index.js";
import { createTestBucket, createTestD1 } from "./test-d1.js";

const JWT_SECRET = "test-secret-test-secret-test-secret";
const encoder = new TextEncoder();

function base64Url(bytes) {
  return Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signedToken(sub = 1) {
  const now = Math.floor(Date.now() / 1000);
  const data = `${base64Url(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })))}.${base64Url(
    encoder.encode(
      JSON.stringify({
        sub,
        email: `student${sub}@example.com`,
        iat: now,
        exp: now + 3600,
        iss: "https://e-studenti.com",
        aud: "https://e-studenti.com",
        tv: 0,
      })
    )
  )}`;
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(JWT_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return `${data}.${base64Url(new Uint8Array(sig))}`;
}

function pdfBytes(size = 2048) {
  const b = new Uint8Array(size);
  b.set([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37], 0);
  return b;
}

/**
 * A real SQLite database behind a D1-shaped adapter, plus the two buckets.
 * Real SQL matters here: a hand-written mock would keep scoping by user after
 * the scoping clause was deleted from the query.
 */
function makeEnv({ withCredentials = true, withUploadBucket = true } = {}) {
  const db = createTestD1();
  db.exec(`
    INSERT INTO users (id, name, surname, email, email_verified)
    VALUES (1, 'Studenti', 'Nje', 'student1@example.com', 1),
           (2, 'Studenti', 'Dy', 'student2@example.com', 1);
  `);

  const quarantine = createTestBucket();
  const materials = createTestBucket();

  const env = {
    DB: db,
    MY_BUCKET: materials,
    ENVIRONMENT: "development",
    JWT_SECRET,
  };
  if (withUploadBucket) env.UPLOAD_BUCKET = quarantine;
  if (withCredentials) {
    env.R2_ACCOUNT_ID = "acct";
    env.R2_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE";
    env.R2_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
  }
  return {
    env,
    db,
    quarantine: quarantine.store,
    published: materials.store,
    pending: () => db.query("SELECT * FROM pending_uploads ORDER BY id"),
    materialRows: () => db.query("SELECT * FROM materials ORDER BY id"),
  };
}

async function post(action, body, env, sub = 1) {
  return worker.fetch(
    new Request(`https://api.e-studenti.com/?action=${action}`, {
      method: "POST",
      headers: {
        Origin: "http://localhost:3000",
        Cookie: `srh_token=${await signedToken(sub)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }),
    env
  );
}

const COLLECTION = {
  title: "Algjebra Lineare",
  faculty: "FIEK",
  department: "Inxhinieri Kompjuterike",
  subject: "Algjebra Lineare",
  study_level: "bachelor",
};

describe("bulk upload — init", () => {
  it("issues one presigned URL per file, keyed by the worker", async () => {
    const { env, pending } = makeEnv();

    const res = await post("bulk-upload-init", {
      collection: COLLECTION,
      files: [
        { filename: "Ligjerata 07.pdf", size: 12_000_000 },
        { filename: "Ligjerata 08.pdf", size: 9_000_000 },
      ],
    }, env);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.files).toHaveLength(2);
    expect(pending()).toHaveLength(2);
    for (const file of body.files) {
      // The worker names the key; the client never supplies it.
      expect(file.key).toMatch(/^pending\/1\/[0-9a-f-]{36}\//);
      expect(file.url).toContain("X-Amz-Signature=");
      expect(file.url).toContain("e-studenti-uploads");
    }
    // Size is pinned in the signature, so the client is told to send it.
    expect(body.files[0].headers).toEqual({ "Content-Length": "12000000" });
    expect(body.collectionId).toBeTruthy();
  });

  it("refuses a file type that is not allowed", async () => {
    const { env, pending } = makeEnv();
    const res = await post("bulk-upload-init", { files: [{ filename: "x.exe", size: 10 }] }, env);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/nuk lejohet/);
    expect(pending()).toHaveLength(0);
  });

  it("refuses a file over the per-file limit", async () => {
    const { env } = makeEnv();
    const res = await post("bulk-upload-init", {
      files: [{ filename: "big.pdf", size: 60 * 1024 * 1024 }],
    }, env);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/50MB/);
  });

  it("refuses a batch over the combined limit", async () => {
    const { env } = makeEnv();
    const files = Array.from({ length: 60 }, (_, i) => ({
      filename: `f${i}.pdf`,
      size: 50 * 1024 * 1024,
    }));
    const res = await post("bulk-upload-init", { files }, env);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/gjithsej/);
  });

  it("refuses more files than a batch may carry", async () => {
    const { env } = makeEnv();
    const files = Array.from({ length: 201 }, (_, i) => ({ filename: `f${i}.pdf`, size: 10 }));
    const res = await post("bulk-upload-init", { files }, env);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/200/);
  });

  it("refuses an unknown faculty on the collection", async () => {
    const { env, pending } = makeEnv();
    const res = await post("bulk-upload-init", {
      collection: { ...COLLECTION, faculty: "NOPE" },
      files: [{ filename: "a.pdf", size: 10 }],
    }, env);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Fakulteti/);
    // Nothing may be signed once the batch is rejected.
    expect(pending()).toHaveLength(0);
  });

  it("charges the rate limit one unit per file, not one per batch", async () => {
    const { env, db } = makeEnv();

    await post("bulk-upload-init", {
      files: Array.from({ length: 40 }, (_, i) => ({ filename: `f${i}.pdf`, size: 1000 })),
    }, env);

    const [row] = db.query("SELECT * FROM rate_limits WHERE key = 'upload:user:1'");
    // Otherwise a batch of 200 would cost the same as uploading one file, and
    // the per-account ceiling would mean nothing.
    expect(row.count).toBe(40);
  });

  it("refuses a batch that would exceed what remains of the hour", async () => {
    const { env, db, pending } = makeEnv();
    // 290 of the 300 hourly units already spent.
    db.exec(
      `INSERT INTO rate_limits (key, count, reset_at)
       VALUES ('upload:user:1', 290, ${Math.floor(Date.now() / 1000) + 3600})`
    );

    const res = await post("bulk-upload-init", {
      files: Array.from({ length: 40 }, (_, i) => ({ filename: `f${i}.pdf`, size: 1000 })),
    }, env);

    expect(res.status).toBe(429);
    // Refused whole: no partial batch, and nothing signed.
    expect(pending()).toHaveLength(0);
    expect(db.query("SELECT count FROM rate_limits WHERE key = 'upload:user:1'")[0].count).toBe(290);
  });

  it("requires authentication", async () => {
    const { env } = makeEnv();
    const res = await worker.fetch(
      new Request("https://api.e-studenti.com/?action=bulk-upload-init", {
        method: "POST",
        headers: { Origin: "http://localhost:3000", "Content-Type": "application/json" },
        body: JSON.stringify({ files: [{ filename: "a.pdf", size: 10 }] }),
      }),
      env
    );
    expect(res.status).toBe(401);
  });

  it("reports itself unconfigured rather than half-working without credentials", async () => {
    const { env } = makeEnv({ withCredentials: false });
    const res = await post("bulk-upload-init", { files: [{ filename: "a.pdf", size: 10 }] }, env);
    expect(res.status).toBe(503);
  });
});

describe("bulk upload — commit", () => {
  async function initAndUpload(env, files, { collection = COLLECTION, bytesFor } = {}) {
    const res = await post("bulk-upload-init", { collection, files }, env);
    const { files: issued } = await res.json();
    for (const file of issued) {
      await env.UPLOAD_BUCKET.put(file.key, bytesFor ? bytesFor(file) : pdfBytes());
    }
    return issued;
  }

  it("publishes a validated file and clears it from quarantine", async () => {
    const { env, pending, materialRows, quarantine, published } = makeEnv();
    const [issued] = await initAndUpload(env, [{ filename: "Ligjerata 07.pdf", size: 2048 }]);

    const res = await post("bulk-upload-commit", {
      files: [{ key: issued.key, title: "Ligjërata 07", type: "Ligjerata" }],
    }, env);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.published).toBe(1);
    expect(body.results[0].ok).toBe(true);
    // Moved, not copied: quarantine is emptied and the pending row is gone.
    expect(quarantine.size).toBe(0);
    expect(pending()).toHaveLength(0);
    expect(published.size).toBe(1);
    expect([...published.keys()][0]).toMatch(/^materials\/1\//);
    // The collection ties the batch together.
    expect(materialRows()[0].collection_id).toBeTruthy();
  });

  it("rejects a file whose bytes do not match its extension", async () => {
    const { env, pending, materialRows, quarantine, published } = makeEnv();
    const [issued] = await initAndUpload(env, [{ filename: "fake.pdf", size: 2048 }], {
      bytesFor: () => new Uint8Array([0x4d, 0x5a, 0x00, 0x00, 0, 0, 0, 0]), // MZ, an executable
    });

    const res = await post("bulk-upload-commit", {
      files: [{ key: issued.key, title: "Fake", type: "Ligjerata" }],
    }, env);
    const body = await res.json();

    expect(body.published).toBe(0);
    expect(body.results[0].error).toMatch(/PDF/);
    // A rejected upload is deleted, not left sitting in the bucket.
    expect(quarantine.size).toBe(0);
    expect(pending()).toHaveLength(0);
    expect(published.size).toBe(0);
  });

  it("publishes the good files in a batch and reports only the bad one", async () => {
    const { env } = makeEnv();
    const issued = await initAndUpload(
      env,
      [
        { filename: "a.pdf", size: 2048 },
        { filename: "b.pdf", size: 2048 },
        { filename: "c.pdf", size: 2048 },
      ],
      { bytesFor: (f) => (f.filename === "b.pdf" ? new Uint8Array(8) : pdfBytes()) }
    );

    const res = await post("bulk-upload-commit", {
      files: issued.map((f) => ({ key: f.key, title: f.filename, type: "Ligjerata" })),
    }, env);
    const body = await res.json();

    // One bad file in three must not discard the other two.
    expect(body.published).toBe(2);
    expect(body.failed).toBe(1);
    expect(body.results.filter((r) => r.ok)).toHaveLength(2);
  });

  it("will not let one user commit another user's pending upload", async () => {
    const { env, published } = makeEnv();
    const [issued] = await initAndUpload(env, [{ filename: "a.pdf", size: 2048 }]);

    // Same key, different account.
    const res = await post("bulk-upload-commit", {
      files: [{ key: issued.key, title: "Stolen", type: "Ligjerata" }],
    }, env, 2);
    const body = await res.json();

    expect(body.published).toBe(0);
    expect(body.results[0].error).toMatch(/nuk u gjet/);
    expect(published.size).toBe(0);
  });

  it("rejects an unknown material type", async () => {
    const { env, published } = makeEnv();
    const [issued] = await initAndUpload(env, [{ filename: "a.pdf", size: 2048 }]);

    const res = await post("bulk-upload-commit", {
      files: [{ key: issued.key, title: "A", type: "Whatever" }],
    }, env);
    const body = await res.json();

    expect(body.published).toBe(0);
    expect(body.results[0].error).toMatch(/Lloji/);
    expect(published.size).toBe(0);
  });

  it("reports a file that was never uploaded", async () => {
    const { env } = makeEnv();
    const res = await post("bulk-upload-init", {
      collection: COLLECTION,
      files: [{ filename: "a.pdf", size: 2048 }],
    }, env);
    const { files } = await res.json();
    // Deliberately skip the PUT.

    const commit = await post("bulk-upload-commit", {
      files: [{ key: files[0].key, title: "A", type: "Ligjerata" }],
    }, env);
    const body = await commit.json();

    expect(body.published).toBe(0);
    expect(body.results[0].error).toMatch(/nuk arriti/);
  });

  it("scans an uploaded ZIP without downloading it", async () => {
    const { env, published } = makeEnv();

    // A ZIP carrying an executable must still be caught once it is in R2.
    const encoderLocal = new TextEncoder();
    function w16(b, o, v) { b[o] = v & 0xff; b[o + 1] = (v >> 8) & 0xff; }
    function w32(b, o, v) { b[o] = v & 0xff; b[o + 1] = (v >>> 8) & 0xff; b[o + 2] = (v >>> 16) & 0xff; b[o + 3] = (v >>> 24) & 0xff; }
    const name = encoderLocal.encode("setup.exe");
    const content = encoderLocal.encode("MZ");
    const local = new Uint8Array(30 + name.length + content.length);
    w32(local, 0, 0x04034b50); w16(local, 4, 20);
    w32(local, 18, content.length); w32(local, 22, content.length);
    w16(local, 26, name.length);
    local.set(name, 30); local.set(content, 30 + name.length);
    const central = new Uint8Array(46 + name.length);
    w32(central, 0, 0x02014b50); w16(central, 4, 20); w16(central, 6, 20);
    w32(central, 20, content.length); w32(central, 24, content.length);
    w16(central, 28, name.length); w32(central, 42, 0);
    central.set(name, 46);
    const eocd = new Uint8Array(22);
    w32(eocd, 0, 0x06054b50); w16(eocd, 8, 1); w16(eocd, 10, 1);
    w32(eocd, 12, central.length); w32(eocd, 16, local.length);
    const archive = new Uint8Array(local.length + central.length + eocd.length);
    archive.set(local, 0); archive.set(central, local.length); archive.set(eocd, local.length + central.length);

    const [issued] = await initAndUpload(env, [{ filename: "provimet.zip", size: archive.length }], {
      bytesFor: () => archive,
    });

    const res = await post("bulk-upload-commit", {
      files: [{ key: issued.key, title: "Provimet", type: "Afat" }],
    }, env);
    const body = await res.json();

    expect(body.published).toBe(0);
    expect(body.results[0].error).toMatch(/\.exe/);
    expect(published.size).toBe(0);
  });
});

describe("abandoned upload sweeper", () => {
  it("deletes pending uploads older than a day, and their objects", async () => {
    const { env, db, pending, quarantine } = makeEnv();
    await post("bulk-upload-init", {
      collection: COLLECTION,
      files: [{ filename: "a.pdf", size: 2048 }, { filename: "b.pdf", size: 2048 }],
    }, env);
    for (const row of pending()) await env.UPLOAD_BUCKET.put(row.object_key, pdfBytes());

    expect(quarantine.size).toBe(2);

    // Age one row past the cutoff, in the database rather than in memory.
    db.exec("UPDATE pending_uploads SET created_at = '2020-01-01 00:00:00' WHERE id = 1");
    const result = await sweepAbandonedUploads(env);

    expect(result.swept).toBe(1);
    // The recent one is untouched — the sweeper must not eat uploads in flight.
    expect(pending()).toHaveLength(1);
    expect(quarantine.size).toBe(1);
  });

  it("does nothing when the quarantine bucket is not configured", async () => {
    const { env } = makeEnv({ withUploadBucket: false });
    await expect(sweepAbandonedUploads(env)).resolves.toEqual({ swept: 0 });
  });
});
