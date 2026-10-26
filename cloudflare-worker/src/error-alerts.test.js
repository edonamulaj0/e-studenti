import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { sendErrorAlert } from "./index.js";
import { MODERATOR_EMAIL } from "./moderators.js";
import { createTestD1 } from "./test-d1.js";

let emails = [];
function stubEmail(ok = true) {
  emails = [];
  vi.stubGlobal("fetch", async (_url, init) => {
    emails.push(JSON.parse(init.body));
    return new Response("{}", { status: ok ? 200 : 500 });
  });
}
afterEach(() => vi.unstubAllGlobals());

function setup() {
  const db = createTestD1();
  // A broken table makes every catalog request fail inside its handler.
  db.raw.exec("DROP TABLE material_votes; DROP TABLE materials;");
  vi.spyOn(console, "error").mockImplementation(() => {});
  return { db, env: { DB: db, ENVIRONMENT: "development", JWT_SECRET: "x".repeat(32), RESEND_API_KEY: "k" } };
}
const fail = (env) => worker.fetch(new Request("https://api.e-studenti.com/?action=materials"), env);

describe("unhandled errors", () => {
  it("are counted per hour with the action and message only", async () => {
    const { env, db } = setup();
    expect((await fail(env)).status).toBe(500);
    await fail(env);
    const rows = db.raw.prepare("SELECT * FROM worker_errors").all();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ count: 2, last_action: "materials" });
    expect(rows[0].last_message).toMatch(/no such table/);
  });

  it("email the moderator once they spike, then stay quiet for six hours", async () => {
    const { env } = setup();
    stubEmail();
    for (let i = 0; i < 9; i += 1) await fail(env);
    const now = new Date();
    expect((await sendErrorAlert(env, now)).sent).toBe(false);

    await fail(env);
    expect((await sendErrorAlert(env, now)).sent).toBe(true);
    expect(emails).toHaveLength(1);
    expect(emails[0].to).toBe(MODERATOR_EMAIL);
    expect(emails[0].subject).toMatch(/10 gabime/);

    expect((await sendErrorAlert(env, new Date(now.getTime() + 3600_000))).sent).toBe(false);
    for (let i = 0; i < 10; i += 1) await fail(env);
    expect((await sendErrorAlert(env, new Date(now.getTime() + 7 * 3600_000))).sent).toBe(false); // errors from earlier hours no longer count
  });

  it("retry next hour when the email could not be sent", async () => {
    const { env, db } = setup();
    stubEmail(false);
    for (let i = 0; i < 10; i += 1) await fail(env);
    expect((await sendErrorAlert(env)).sent).toBe(false);
    expect(db.raw.prepare("SELECT * FROM ops_alerts").all()).toEqual([]);
  });
});
