import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "./index.js";

function makeEnv({ existingUser }) {
  const writes = [];
  const db = {
    prepare(sql) {
      const statement = {
        bind: () => statement,
        async run() {
          writes.push(sql);
          return { meta: { changes: 1 } };
        },
        async first() {
          if (/FROM users WHERE email/.test(sql)) return existingUser;
          return null;
        },
        async all() {
          return { results: [] };
        },
      };
      return statement;
    },
  };
  return { writes, env: { DB: db, ENVIRONMENT: "development", JWT_SECRET: "s".repeat(40), RESEND_API_KEY: "re_test" } };
}

function register(env) {
  return worker.fetch(
    new Request("https://api.e-studenti.com/?action=register", {
      method: "POST",
      headers: { Origin: "https://e-studenti.com", "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Ana", surname: "Beri", email: "ana@gmail.com" }),
    }),
    env
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("register for an email that already has an account", () => {
  it("sends a sign-in code instead of silently doing nothing", async () => {
    const sent = [];
    vi.stubGlobal("fetch", async (url, init) => {
      sent.push({ url: String(url), body: JSON.parse(init.body) });
      return new Response("{}", { status: 200 });
    });
    const { env, writes } = makeEnv({
      existingUser: { id: 5, name: "Ana", email: "ana@gmail.com", email_verified: 1 },
    });

    const response = await register(env);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(sent).toHaveLength(1);
    expect(sent[0].url).toBe("https://api.resend.com/emails");
    expect(sent[0].body.to).toBe("ana@gmail.com");
    expect(sent[0].body.subject).toMatch(/hyrjes/);
    expect(writes.some((sql) => /INSERT OR REPLACE INTO verification_codes/.test(sql))).toBe(true);
  });

  it("does not overwrite the verified user's stored name", async () => {
    vi.stubGlobal("fetch", async () => new Response("{}", { status: 200 }));
    const { env, writes } = makeEnv({
      existingUser: { id: 5, name: "Ana", email: "ana@gmail.com", email_verified: 1 },
    });

    await register(env);

    expect(writes.some((sql) => /INSERT OR IGNORE INTO users|UPDATE users SET name/.test(sql))).toBe(false);
  });

  it("still creates and verifies a brand-new account the usual way", async () => {
    const sent = [];
    vi.stubGlobal("fetch", async (url, init) => {
      sent.push(JSON.parse(init.body));
      return new Response("{}", { status: 200 });
    });
    const { env, writes } = makeEnv({ existingUser: null });

    const response = await register(env);

    expect(response.status).toBe(200);
    expect(writes.some((sql) => /INSERT OR IGNORE INTO users/.test(sql))).toBe(true);
    expect(sent[0].subject).toMatch(/verifikimit/);
  });
});
