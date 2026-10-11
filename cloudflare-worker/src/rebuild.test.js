import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { triggerRebuildIfDue } from "./index.js";

const HOOK = "https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/abc";

/** Minimal rebuild_state table. */
function makeEnv(initial = { dirty_since: "2026-10-11 08:00:00", last_triggered_at: null }, extra = {}) {
  const state = { ...initial };
  const db = {
    prepare(sql) {
      let args = [];
      const st = {
        bind: (...a) => ((args = a), st),
        async first() {
          return /FROM rebuild_state/.test(sql) ? { ...state } : null;
        },
        async run() {
          if (/SET dirty_since = NULL, last_triggered_at = \?/.test(sql)) {
            state.dirty_since = null;
            state.last_triggered_at = args[0];
          } else if (/SET dirty_since = COALESCE\(dirty_since, \?\)/.test(sql)) {
            state.dirty_since = state.dirty_since ?? args[0];
            state.last_triggered_at = args[1];
          } else if (/INSERT INTO rebuild_state/.test(sql)) {
            state.dirty_since = state.dirty_since ?? "2026-10-11 12:00:00";
          }
          return { meta: { changes: 1 } };
        },
        async all() {
          return { results: [] };
        },
      };
      return st;
    },
  };
  return { state, env: { DB: db, PAGES_DEPLOY_HOOK: HOOK, ENVIRONMENT: "development", ...extra } };
}

const NOW = new Date("2026-10-11T12:00:00Z");
afterEach(() => vi.unstubAllGlobals());

describe("rebuild trigger", () => {
  it("does nothing unless a deploy hook is configured", async () => {
    const { env } = makeEnv(undefined, { PAGES_DEPLOY_HOOK: undefined });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect((await triggerRebuildIfDue(env, NOW)).reason).toBe("not_configured");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refuses a hook that is not a Cloudflare URL", async () => {
    const { env } = makeEnv(undefined, { PAGES_DEPLOY_HOOK: "https://evil.example/hook" });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect((await triggerRebuildIfDue(env, NOW)).reason).toBe("invalid_hook");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("stays quiet when nothing changed", async () => {
    const { env } = makeEnv({ dirty_since: null, last_triggered_at: null });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect((await triggerRebuildIfDue(env, NOW)).reason).toBe("clean");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("requests one build and clears the mark", async () => {
    const { env, state } = makeEnv();
    const fetchSpy = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    expect((await triggerRebuildIfDue(env, NOW)).triggered).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe(HOOK);
    expect(fetchSpy.mock.calls[0][1].method).toBe("POST");
    expect(state.dirty_since).toBeNull();
    expect(state.last_triggered_at).toBe("2026-10-11 12:00:00");
  });

  it("waits out the minimum interval between builds", async () => {
    const { env, state } = makeEnv({ dirty_since: "2026-10-11 11:30:00", last_triggered_at: "2026-10-11 11:00:00" });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    expect((await triggerRebuildIfDue(env, NOW)).reason).toBe("too_soon");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(state.dirty_since).not.toBeNull(); // still waiting, not forgotten

    const later = new Date("2026-10-11T13:30:00Z");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    expect((await triggerRebuildIfDue(env, later)).triggered).toBe(true);
  });

  it("keeps the change marked when the hook fails, so the next run retries", async () => {
    const { env, state } = makeEnv();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 500 })));

    expect((await triggerRebuildIfDue(env, NOW)).reason).toBe("hook_failed");
    expect(state.dirty_since).toBe("2026-10-11 08:00:00");
    expect(state.last_triggered_at).toBeNull();
  });

  it("runs from the hourly schedule", async () => {
    const { env } = makeEnv();
    const fetchSpy = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const pending = [];
    await worker.scheduled({}, env, { waitUntil: (p) => pending.push(p) });
    await Promise.all(pending);
    expect(fetchSpy.mock.calls.some(([url]) => url === HOOK)).toBe(true);
  });
});
