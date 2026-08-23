import { afterEach, describe, expect, it, vi } from "vitest";

import worker from "./index.js";

const MEDIA = "https://media.e-studenti.com";

/**
 * A DB stand-in that actually enforces the rate limit, so the cache-miss path
 * can be counted rather than assumed.
 */
function makeEnv({ limit = 600 } = {}) {
  const counts = new Map();
  const db = {
    prepare(sql) {
      let bound = [];
      const statement = {
        bind: (...args) => {
          bound = args;
          return statement;
        },
        async run() {
          if (/INSERT INTO rate_limits/.test(sql)) {
            const key = bound[0];
            const cap = bound[bound.length - 1];
            const next = (counts.get(key) || 0) + 1;
            counts.set(key, next);
            return { meta: { changes: next <= cap ? 1 : 0 } };
          }
          return { meta: { changes: 1 } };
        },
        async first() {
          if (/SELECT reset_at/.test(sql)) return { reset_at: Math.floor(Date.now() / 1000) + 3600 };
          return null;
        },
        async all() {
          return { results: [] };
        },
      };
      return statement;
    },
  };
  return { env: { DB: db, ENVIRONMENT: "development", JWT_SECRET: "x".repeat(32) }, counts, limit };
}

function proxyRequest(target) {
  return new Request(
    `https://api.e-studenti.com/?action=proxy&url=${encodeURIComponent(target)}`,
    { headers: { Origin: "http://localhost:3000", "CF-Connecting-IP": "203.0.113.9" } }
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Records what the worker fetches upstream and what it stores in the edge cache. */
function stubNetworkAndCache({ cacheHit = null } = {}) {
  const fetches = [];
  const puts = [];
  vi.stubGlobal("fetch", async (url) => {
    fetches.push(String(url));
    return new Response(new Uint8Array([0x25, 0x50, 0x44, 0x46]), {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
    });
  });
  vi.stubGlobal("caches", {
    default: {
      async match() {
        return cacheHit;
      },
      async put(key, value) {
        puts.push({ key: String(key.url || key), status: value.status });
      },
    },
  });
  return { fetches, puts };
}

describe("media proxy", () => {
  it("refuses a URL outside the media domain", async () => {
    const { env } = makeEnv();
    const { fetches } = stubNetworkAndCache();

    const res = await worker.fetch(proxyRequest("https://evil.example.com/payload"), env);

    expect(res.status).toBe(403);
    // Nothing may be fetched before the origin is checked.
    expect(fetches).toHaveLength(0);
  });

  it("refuses plain http on the media domain", async () => {
    const { env } = makeEnv();
    const { fetches } = stubNetworkAndCache();

    const res = await worker.fetch(proxyRequest("http://media.e-studenti.com/a.pdf"), env);

    expect(res.status).toBe(403);
    expect(fetches).toHaveLength(0);
  });

  it("serves a media file and stores it in the edge cache", async () => {
    const { env } = makeEnv();
    const { fetches, puts } = stubNetworkAndCache();

    const res = await worker.fetch(proxyRequest(`${MEDIA}/materials/1/a.pdf`), env);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(fetches).toEqual([`${MEDIA}/materials/1/a.pdf`]);
    expect(puts).toEqual([{ key: `${MEDIA}/materials/1/a.pdf`, status: 200 }]);
  });

  it("answers a cache hit without fetching or metering", async () => {
    const { env, counts } = makeEnv();
    const cached = new Response("cached", { status: 200 });
    const { fetches } = stubNetworkAndCache({ cacheHit: cached });

    const res = await worker.fetch(proxyRequest(`${MEDIA}/materials/1/a.pdf`), env);

    expect(res.status).toBe(200);
    // The whole point: a hit costs neither a subrequest nor a rate-limit write.
    expect(fetches).toHaveLength(0);
    expect(counts.size).toBe(0);
  });

  it("meters cold requests and refuses once the cap is passed", async () => {
    const { env, counts } = makeEnv();
    stubNetworkAndCache();

    for (let i = 0; i < 600; i += 1) {
      const res = await worker.fetch(proxyRequest(`${MEDIA}/materials/1/${i}.pdf`), env);
      expect(res.status).toBe(200);
    }
    expect(counts.get("proxy:203.0.113.9")).toBe(600);

    const overLimit = await worker.fetch(proxyRequest(`${MEDIA}/materials/1/over.pdf`), env);
    expect(overLimit.status).toBe(429);
  });

  it("does not cache a non-200 upstream response", async () => {
    const { env } = makeEnv();
    const puts = [];
    vi.stubGlobal("fetch", async () => new Response("gone", { status: 404 }));
    vi.stubGlobal("caches", {
      default: {
        async match() {
          return null;
        },
        async put(key, value) {
          puts.push(value.status);
        },
      },
    });

    const res = await worker.fetch(proxyRequest(`${MEDIA}/materials/1/missing.pdf`), env);

    expect(res.status).toBe(404);
    // A 404 cached for five minutes would outlast whatever caused it.
    expect(puts).toHaveLength(0);
  });

  it("follows a redirect only while it stays on the media domain", async () => {
    const { env } = makeEnv();
    const fetches = [];
    vi.stubGlobal("fetch", async (url) => {
      fetches.push(String(url));
      if (String(url).endsWith("start.pdf")) {
        return new Response(null, {
          status: 302,
          headers: { Location: "https://evil.example.com/payload" },
        });
      }
      return new Response("ok", { status: 200 });
    });
    vi.stubGlobal("caches", { default: { async match() { return null; }, async put() {} } });

    const res = await worker.fetch(proxyRequest(`${MEDIA}/start.pdf`), env);

    expect(res.status).toBe(403);
    // It must stop at the redirect, not follow it off-domain.
    expect(fetches).toEqual([`${MEDIA}/start.pdf`]);
  });
});
