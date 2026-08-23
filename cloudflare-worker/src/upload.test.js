import { describe, expect, it } from "vitest";
import worker, { validateZipArchive } from "./index.js";

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
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: 1,
    email: "student@example.com",
    iat: now,
    exp: now + 3600,
    iss: "https://e-studenti.com",
    aud: "https://e-studenti.com",
    tv: 0,
  };
  const data = `${base64Url(encoder.encode(JSON.stringify(header)))}.${base64Url(
    encoder.encode(JSON.stringify(payload))
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

function makeEnv() {
  const puts = [];
  const inserts = [];
  const binds = [];
  const db = {
    prepare(sql) {
      const statement = {
        bind: (...args) => {
          binds.push({ sql, args });
          return statement;
        },
        async run() {
          if (/INSERT INTO rate_limits/.test(sql)) return { meta: { changes: 1 } };
          if (/INSERT INTO materials/.test(sql)) {
            inserts.push(sql);
            return { meta: { last_row_id: 7 } };
          }
          return { meta: { changes: 1 } };
        },
        async first() {
          if (/FROM users WHERE id/.test(sql)) {
            return {
              id: 1,
              email: "student@example.com",
              name: "Studenti",
              token_version: 0,
              is_moderator: 0,
            };
          }
          return null;
        },
        async all() {
          return { results: [] };
        },
      };
      return statement;
    },
  };

  return {
    puts,
    inserts,
    binds,
    env: {
      DB: db,
      MY_BUCKET: {
        async put(key, value) {
          puts.push({ key, value });
          return {};
        },
      },
      ENVIRONMENT: "development",
      JWT_SECRET,
    },
  };
}

function pdfBytes(size) {
  const bytes = new Uint8Array(size);
  bytes.set([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37], 0); // %PDF-1.7
  return bytes;
}

function writeUInt16LE(bytes, offset, value) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >> 8) & 0xff;
}

function writeUInt32LE(bytes, offset, value) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

/**
 * Builds a ZIP with stored (uncompressed) entries. `localName` may differ from
 * `name` to emulate an archive whose local headers disagree with its central
 * directory.
 */
function zipBytes(entries) {
  const parts = [];
  const central = [];
  let offset = 0;

  for (const entry of entries) {
    const content = encoder.encode(entry.content ?? "");
    const localName = encoder.encode(entry.localName ?? entry.name);
    const centralName = encoder.encode(entry.name);

    const local = new Uint8Array(30 + localName.length + content.length);
    writeUInt32LE(local, 0, 0x04034b50);
    writeUInt16LE(local, 4, 20);
    writeUInt32LE(local, 18, content.length);
    writeUInt32LE(local, 22, content.length);
    writeUInt16LE(local, 26, localName.length);
    local.set(localName, 30);
    local.set(content, 30 + localName.length);
    parts.push(local);

    // The validator never decompresses: it trusts the size the central directory
    // declares. `declaredSize` exercises that path without allocating the bytes.
    const declaredSize = entry.declaredSize ?? content.length;
    const header = new Uint8Array(46 + centralName.length);
    writeUInt32LE(header, 0, 0x02014b50);
    writeUInt16LE(header, 4, 20);
    writeUInt16LE(header, 6, 20);
    writeUInt32LE(header, 20, content.length);
    writeUInt32LE(header, 24, declaredSize);
    writeUInt16LE(header, 28, centralName.length);
    writeUInt32LE(header, 42, offset);
    header.set(centralName, 46);
    central.push(header);

    offset += local.length;
  }

  const centralSize = central.reduce((total, header) => total + header.length, 0);
  const eocd = new Uint8Array(22);
  writeUInt32LE(eocd, 0, 0x06054b50);
  writeUInt16LE(eocd, 8, entries.length);
  writeUInt16LE(eocd, 10, entries.length);
  writeUInt32LE(eocd, 12, centralSize);
  writeUInt32LE(eocd, 16, offset);

  const all = [...parts, ...central, eocd];
  const total = all.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let cursor = 0;
  for (const part of all) {
    output.set(part, cursor);
    cursor += part.length;
  }
  return output;
}

async function upload({ env, file, type = "Provime Pranuese", faculty = "MED", contentLength }) {
  const isPranues = type === "Provime Pranuese";
  const form = new FormData();
  form.append("title", "Stomatologji - Provimi pranues 2024");
  form.append("faculty", faculty);
  form.append("department", isPranues ? "//" : "Stomatologji");
  form.append("subject", isPranues ? "//" : "Anatomi");
  form.append("teacher", isPranues ? "//" : "Prof. Dr.");
  form.append("type", type);
  form.append("study_level", "bachelor");
  form.append("is_anonymous", "0");
  form.append("file", file);

  const request = new Request("https://api.e-studenti.com/?action=upload", {
    method: "POST",
    headers: {
      Origin: "http://localhost:3000",
      Cookie: `srh_token=${await signedToken()}`,
    },
    body: form,
  });
  if (contentLength !== undefined) {
    // Request headers are immutable once built from a body, so the oversized
    // case is exercised through a clone with an overridden Content-Length.
    const headers = new Headers(request.headers);
    headers.set("Content-Length", String(contentLength));
    return worker.fetch(new Request(request, { headers }), env);
  }
  return worker.fetch(request, env);
}

describe("zip scanning reads ranges, not the whole archive", () => {
  /** Records every range the walker asks for. */
  function countingReader(archive) {
    const stats = { total: 0, largest: 0, calls: 0 };
    const read = async (start, end) => {
      stats.total += end - start;
      stats.largest = Math.max(stats.largest, end - start);
      stats.calls += 1;
      return archive.slice(start, end);
    };
    return { read, stats };
  }

  it("validates a 10MB archive while reading a sliver of it", async () => {
    const bulk = "x".repeat(2 * 1024 * 1024);
    const archive = zipBytes([
      { name: "ligjeratat/01.pdf", content: bulk },
      { name: "ligjeratat/02.pdf", content: bulk },
      { name: "ligjeratat/03.pdf", content: bulk },
      { name: "ligjeratat/04.pdf", content: bulk },
      { name: "ligjeratat/05.pdf", content: bulk },
    ]);
    expect(archive.length).toBeGreaterThan(10 * 1024 * 1024);

    const { read, stats } = countingReader(archive);
    const result = await validateZipArchive(archive.length, read);

    expect(result.ok).toBe(true);
    // The previous implementation pulled 100% of the archive into a second
    // buffer. This must touch only the tail, the central directory and a few
    // dozen bytes per local header.
    expect(stats.total).toBeLessThan(archive.length / 50);
    // And no single read may be large enough to matter on its own.
    expect(stats.largest).toBeLessThanOrEqual(128 * 1024);
  });

  it("reads the same amount whether the archive is 4MB or 32MB", async () => {
    // The point of the rewrite: cost is a function of the number of entries,
    // not of the archive's size. A small archive is read in full because the
    // 64KB end-of-central-directory search window covers it, and that is fine —
    // what must not happen is that cost tracking the file.
    async function bytesReadFor(megabytes) {
      const archive = zipBytes([
        { name: "ligjeratat/01.pdf", content: "x".repeat(megabytes * 1024 * 1024) },
      ]);
      const { read, stats } = countingReader(archive);
      const result = await validateZipArchive(archive.length, read);
      expect(result.ok).toBe(true);
      return stats.total;
    }

    const small = await bytesReadFor(4);
    const large = await bytesReadFor(32);

    // Eightfold the archive, and the walk reads no more than it did before.
    expect(large).toBeLessThanOrEqual(small);
    expect(large).toBeLessThan(128 * 1024);
  });

  it("rejects an archive with no end-of-central-directory record", async () => {
    const junk = new Uint8Array(200);
    const result = await validateZipArchive(junk.length, async (start, end) =>
      junk.slice(start, end)
    );
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/nuk është i vlefshëm/);
  });

  it("rejects a central directory offset pointing past the EOCD", async () => {
    const archive = zipBytes([{ name: "a.pdf", content: "%PDF-1.7" }]);
    const eocdAt = archive.length - 22;
    writeUInt32LE(archive, eocdAt + 16, archive.length - 4);

    const result = await validateZipArchive(archive.length, async (start, end) =>
      archive.slice(start, end)
    );
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/lexohet sigurt/);
  });
});

describe("material upload", () => {
  it("accepts a Provime Pranuese PDF and stores it without buffering a copy", async () => {
    const { env, puts } = makeEnv();
    const file = new File([pdfBytes(2048)], "provimi-pranues.pdf", {
      type: "application/pdf",
    });

    const response = await upload({ env, file });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.material.type).toBe("Provime Pranuese");
    expect(body.material.subject).toBe("//");
    expect(puts).toHaveLength(1);
    expect(puts[0].value).toBeInstanceOf(Blob);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:3000"
    );
  });

  it("rejects an oversized body before parsing it, with CORS headers intact", async () => {
    const { env, puts } = makeEnv();
    const file = new File([pdfBytes(2048)], "provimi-pranues.pdf", {
      type: "application/pdf",
    });

    const response = await upload({ env, file, contentLength: 80 * 1024 * 1024 });
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body.error).toMatch(/50MB/);
    expect(puts).toHaveLength(0);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:3000"
    );
  });

  it("accepts a ZIP of allowed files", async () => {
    const { env } = makeEnv();
    const file = new File(
      [zipBytes([{ name: "provimet/2024.pdf", content: "%PDF-1.7 exam" }])],
      "provimet.zip",
      { type: "application/zip" }
    );

    const response = await upload({ env, file });
    expect(response.status).toBe(200);
  });

  it("rejects a ZIP containing an executable", async () => {
    const { env } = makeEnv();
    const file = new File(
      [zipBytes([{ name: "provimet/setup.exe", content: "MZ" }])],
      "provimet.zip",
      { type: "application/zip" }
    );

    const response = await upload({ env, file });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/\.exe/);
  });

  it("accepts a ZIP entry larger than 10MB", async () => {
    const { env } = makeEnv();
    const file = new File(
      [
        zipBytes([
          {
            name: "ligjeratat/skanimi.pdf",
            content: "%PDF-1.7 scan",
            declaredSize: 18 * 1024 * 1024,
          },
        ]),
      ],
      "ligjeratat.zip",
      { type: "application/zip" }
    );

    const response = await upload({ env, file });
    expect(response.status).toBe(200);
  });

  it("names the file and both limits when a ZIP entry is over 50MB", async () => {
    const { env } = makeEnv();
    const file = new File(
      [
        zipBytes([
          {
            name: "ligjeratat/skanimi-i-madh.pdf",
            content: "%PDF-1.7 scan",
            declaredSize: 64 * 1024 * 1024,
          },
        ]),
      ],
      "ligjeratat.zip",
      { type: "application/zip" }
    );

    const response = await upload({ env, file });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("skanimi-i-madh.pdf");
    expect(body.error).toContain("64MB");
    expect(body.error).toContain("50MB");
  });

  it("rejects a ZIP that inflates past the total limit", async () => {
    const { env } = makeEnv();
    const file = new File(
      [
        zipBytes([
          { name: "a.pdf", content: "%PDF-1.7", declaredSize: 40 * 1024 * 1024 },
          { name: "b.pdf", content: "%PDF-1.7", declaredSize: 40 * 1024 * 1024 },
          { name: "c.pdf", content: "%PDF-1.7", declaredSize: 40 * 1024 * 1024 },
        ]),
      ],
      "bombe.zip",
      { type: "application/zip" }
    );

    const response = await upload({ env, file });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("100MB");
  });

  it("rate limits per account rather than per IP", async () => {
    const { env, binds } = makeEnv();
    const file = new File([pdfBytes(2048)], "provimi-pranues.pdf", {
      type: "application/pdf",
    });

    const response = await upload({ env, file });
    expect(response.status).toBe(200);

    const rateLimit = binds.find((entry) => /INSERT INTO rate_limits/.test(entry.sql));
    expect(rateLimit).toBeDefined();
    // Key is the first bound argument; the signed token in these tests is user 1.
    expect(rateLimit.args[0]).toBe("upload:user:1");
    // …and the cap bound last is the bulk-friendly one, not the old 10.
    expect(rateLimit.args[rateLimit.args.length - 1]).toBe(300);
  });

  it("rejects an unauthenticated upload without recording a rate-limit hit", async () => {
    const { env, binds } = makeEnv();
    const form = new FormData();
    form.append("title", "Pa token");
    form.append("faculty", "MED");
    form.append("type", "Provime Pranuese");
    form.append("file", new File([pdfBytes(2048)], "x.pdf", { type: "application/pdf" }));

    const response = await worker.fetch(
      new Request("https://api.e-studenti.com/?action=upload", {
        method: "POST",
        headers: { Origin: "http://localhost:3000" },
        body: form,
      }),
      env
    );

    expect(response.status).toBe(401);
    expect(binds.some((entry) => /INSERT INTO rate_limits/.test(entry.sql))).toBe(false);
  });

  // Windows strips trailing dots and spaces, and C extractors truncate at NUL,
  // so each of these lands on disk as setup.exe.
  const DISGUISED_EXECUTABLES = [
    ["provimet/setup.exe.", "trailing dot"],
    ["provimet/setup.exe ", "trailing space"],
    ["provimet/setup.exe\u0000.pdf", "NUL truncation"],
    ["provimet/setup.exe\t", "trailing tab"],
  ];

  for (const [name, trick] of DISGUISED_EXECUTABLES) {
    it(`rejects an executable disguised by ${trick}`, async () => {
      const { env, puts } = makeEnv();
      const file = new File([zipBytes([{ name, content: "MZ" }])], "provimet.zip", {
        type: "application/zip",
      });

      const response = await upload({ env, file });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toMatch(/\.exe/);
      expect(puts).toHaveLength(0);
    });
  }

  const TRAVERSAL_PATHS = [
    ["../../../etc/passwd", "parent-directory escape"],
    ["/etc/cron.d/payload", "absolute path"],
    ["C:/Windows/System32/x.dll", "drive-letter path"],
    ["provimet/../../escape.pdf", "escape through a subdirectory"],
  ];

  for (const [name, trick] of TRAVERSAL_PATHS) {
    it(`rejects a ZIP entry using a ${trick}`, async () => {
      const { env, puts } = makeEnv();
      const file = new File([zipBytes([{ name, content: "%PDF-1.7" }])], "provimet.zip", {
        type: "application/zip",
      });

      const response = await upload({ env, file });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toMatch(/shteg/);
      expect(puts).toHaveLength(0);
    });
  }

  it("still accepts ordinary nested names with dots in them", async () => {
    const { env } = makeEnv();
    const file = new File(
      [
        zipBytes([
          { name: "Viti 1/Semestri 2/algjebra.lineare.v2.pdf", content: "%PDF-1.7" },
          { name: "Viti 1/", content: "" },
        ]),
      ],
      "provimet.zip",
      { type: "application/zip" }
    );

    const response = await upload({ env, file });
    expect(response.status).toBe(200);
  });

  it("gives each upload a distinct key even within the same millisecond", async () => {
    const { env, puts } = makeEnv();
    const makeFile = () =>
      new File([pdfBytes(2048)], "ligjerata.pdf", { type: "application/pdf" });

    // Date.now is frozen so the collision is forced rather than raced: same
    // user, same filename, same millisecond is exactly the case where a
    // timestamp-only key made the second R2 put overwrite the first.
    const realNow = Date.now;
    Date.now = () => 1_700_000_000_000;
    try {
      await Promise.all([
        upload({ env, file: makeFile() }),
        upload({ env, file: makeFile() }),
        upload({ env, file: makeFile() }),
      ]);
    } finally {
      Date.now = realNow;
    }

    expect(puts).toHaveLength(3);
    expect(new Set(puts.map((p) => p.key)).size).toBe(3);
  });

  it("rejects an unknown faculty code", async () => {
    const { env, puts } = makeEnv();
    const file = new File([pdfBytes(2048)], "x.pdf", { type: "application/pdf" });

    const response = await upload({ env, file, faculty: "NOT-A-FACULTY" });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/Fakulteti/);
    expect(puts).toHaveLength(0);
  });

  it("rejects an unknown material type", async () => {
    const { env, puts } = makeEnv();
    const file = new File([pdfBytes(2048)], "x.pdf", { type: "application/pdf" });

    const response = await upload({ env, file, type: "Whatever I Want" });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/Lloji/);
    expect(puts).toHaveLength(0);
  });

  it("rejects an empty file by name rather than as a malformed PDF", async () => {
    const { env, puts } = makeEnv();
    const file = new File([new Uint8Array(0)], "bosh.pdf", { type: "application/pdf" });

    const response = await upload({ env, file });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/bosh/);
    expect(puts).toHaveLength(0);
  });

  it("rejects a ZIP whose local header hides a different name", async () => {
    const { env } = makeEnv();
    const file = new File(
      [
        zipBytes([
          { name: "provimet/2024.pdf", localName: "provimet/setup.exe", content: "MZ" },
        ]),
      ],
      "provimet.zip",
      { type: "application/zip" }
    );

    const response = await upload({ env, file });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/\.exe/);
  });
});
