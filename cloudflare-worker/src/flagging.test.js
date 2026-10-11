import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { sendReportAlerts } from "./index.js";
import { sanitizeMaterialForPublic } from "./material-privacy.js";

const JWT_SECRET = "test-secret-test-secret-test-secret";
const MOD = "edonaamulaj@gmail.com";
const enc = new TextEncoder();
const b64 = (bytes) =>
  Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function token(sub = 1) {
  const now = Math.floor(Date.now() / 1000);
  const data = `${b64(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })))}.${b64(
    enc.encode(JSON.stringify({ sub, iat: now, exp: now + 3600, iss: "https://e-studenti.com", aud: "https://e-studenti.com", tv: 0 }))
  )}`;
  const key = await crypto.subtle.importKey("raw", enc.encode(JWT_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return `${data}.${b64(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data))))}`;
}

/**
 * A fake D1 that understands just the statements these features use.
 *  - reports: array of { material_id, reporter_key, status }
 *  - alerts: Map material_id -> { notified_at, reminded_at }
 */
function makeEnv({ email = "student@example.com", reports = [], alerts = new Map(), materials = {}, trusted = {} } = {}) {
  const calls = [];
  const db = {
    prepare(sql) {
      let args = [];
      const st = {
        bind: (...a) => ((args = a), st),
        async run() {
          calls.push({ sql, args });
          if (/INSERT OR IGNORE INTO reports/.test(sql)) {
            const [material_id, reporter_id, reason, reporter_key] = args;
            if (reports.some((r) => r.material_id === material_id && r.reporter_key === reporter_key)) {
              return { meta: { changes: 0 } };
            }
            reports.push({ id: reports.length + 1, material_id, reporter_id, reason, reporter_key, status: "pending" });
            return { meta: { changes: 1 } };
          }
          if (/INSERT OR IGNORE INTO report_alerts/.test(sql)) {
            if (!alerts.has(args[0])) alerts.set(args[0], { notified_at: null, reminded_at: null });
            return { meta: { changes: 1 } };
          }
          if (/UPDATE report_alerts SET notified_at = datetime\('now'\) WHERE material_id = \? AND notified_at IS NULL/.test(sql)) {
            const a = alerts.get(args[0]);
            if (a && !a.notified_at) { a.notified_at = "2026-10-11 10:00:00"; return { meta: { changes: 1 } }; }
            return { meta: { changes: 0 } };
          }
          if (/UPDATE report_alerts SET notified_at = NULL/.test(sql)) { alerts.get(args[0]).notified_at = null; return { meta: { changes: 1 } }; }
          if (/UPDATE report_alerts SET notified_at = datetime\('now'\) WHERE material_id = \?/.test(sql)) { alerts.get(args[0]).notified_at = "2026-10-11 10:00:00"; return { meta: { changes: 1 } }; }
          if (/UPDATE report_alerts SET reminded_at/.test(sql)) { alerts.get(args[0]).reminded_at = "2026-10-12 10:00:00"; return { meta: { changes: 1 } }; }
          if (/UPDATE reports SET status/.test(sql)) {
            const r = reports.find((x) => x.id === args[1] && x.status === "pending");
            if (!r) return { meta: { changes: 0 } };
            r.status = args[0];
            return { meta: { changes: 1 } };
          }
          if (/DELETE FROM report_alerts/.test(sql)) { alerts.delete(args[0]); return { meta: { changes: 1 } }; }
          if (/UPDATE materials\s+SET status = 'pending'/.test(sql)) {
            const m = materials[args[0]];
            if (m && m.status === "approved") { m.status = "pending"; return { meta: { changes: 1 } }; }
            return { meta: { changes: 0 } };
          }
          if (/UPDATE users SET trust_revoked/.test(sql)) { trusted[args[1]] = args[0]; return { meta: { changes: 1 } }; }
          return { meta: { changes: 1 } };
        },
        async first() {
          if (/FROM users WHERE id/.test(sql)) return { id: 1, email, name: "U", token_version: 0, is_moderator: 0 };
          if (/SELECT id FROM materials WHERE id = \?/.test(sql)) return materials[args[0]] ? { id: args[0] } : null;
          if (/COUNT\(DISTINCT COALESCE\(r\.reporter_key.*FROM reports r WHERE r\.material_id = \?/.test(sql)) {
            const people = new Set(reports.filter((r) => r.material_id === args[0] && r.status === "pending").map((r) => r.reporter_key ?? `legacy:${r.id}`));
            return { people: people.size };
          }
          if (/SELECT material_id FROM reports WHERE id/.test(sql)) {
            const r = reports.find((x) => x.id === args[0]);
            return r ? { material_id: r.material_id } : null;
          }
          return null;
        },
        async all() {
          if (/FROM reports r\s+JOIN materials m/.test(sql) && /HAVING people/.test(sql)) {
            const byMat = new Map();
            for (const r of reports.filter((x) => x.status === "pending")) {
              if (materials[r.material_id]?.status !== "approved") continue;
              if (/AND m\.id = \?/.test(sql) && args[0] !== r.material_id) continue;
              (byMat.get(r.material_id) || byMat.set(r.material_id, new Set()).get(r.material_id)).add(r.reporter_key ?? `legacy:${r.id}`);
            }
            return {
              results: [...byMat.entries()]
                .filter(([, set]) => set.size >= 3)
                .map(([id, set]) => ({ id, title: materials[id].title, faculty: "MED", subject: "Anatomi", people: set.size, ...(alerts.get(id) || { notified_at: null, reminded_at: null }) })),
            };
          }
          if (/SELECT reason, COUNT/.test(sql)) {
            const counts = {};
            for (const r of reports.filter((x) => x.material_id === args[0] && x.status === "pending")) counts[r.reason] = (counts[r.reason] || 0) + 1;
            return { results: Object.entries(counts).map(([reason, n]) => ({ reason, n })) };
          }
          return { results: [] };
        },
      };
      return st;
    },
  };
  return { calls, reports, alerts, env: { DB: db, ENVIRONMENT: "production", JWT_SECRET, RESEND_API_KEY: "re_test" } };
}

const mats = () => ({ 7: { id: 7, title: "Notat e rrezikshme <b>", status: "approved" } });
let emails;
function stubEmail(ok = true) {
  emails = [];
  vi.stubGlobal("fetch", async (url, init) => {
    emails.push(JSON.parse(init.body));
    return new Response("{}", { status: ok ? 200 : 500 });
  });
}
afterEach(() => vi.unstubAllGlobals());

async function report(env, { ip, signedIn = false, reason = "Përmbajtje e papërshtatshme", id = 7 } = {}) {
  const headers = { Origin: "https://e-studenti.com", "Content-Type": "application/json", "CF-Connecting-IP": ip || "1.1.1.1" };
  if (signedIn) headers.Cookie = `srh_token=${await token()}`;
  return worker.fetch(
    new Request("https://api.e-studenti.com/?action=report", { method: "POST", headers, body: JSON.stringify({ material_id: id, reason }) }),
    env
  );
}

describe("report counting", () => {
  it("counts one report per person even if they submit twice", async () => {
    stubEmail();
    const { env, reports } = makeEnv({ materials: mats() });
    await report(env, { ip: "1.1.1.1" });
    const again = await report(env, { ip: "1.1.1.1" });
    expect(again.status).toBe(200); // same answer, nothing to see
    expect(reports).toHaveLength(1);
  });

  it("tells people apart by account when signed in", async () => {
    stubEmail();
    const { env, reports } = makeEnv({ materials: mats() });
    await report(env, { ip: "1.1.1.1", signedIn: true });
    await report(env, { ip: "2.2.2.2" });
    expect(reports.map((r) => r.reporter_key.split(":")[0]).sort()).toEqual(["a", "u"]);
  });

  it("never stores the address itself", async () => {
    stubEmail();
    const { env, reports } = makeEnv({ materials: mats() });
    await report(env, { ip: "203.0.113.9" });
    expect(JSON.stringify(reports)).not.toContain("203.0.113.9");
  });
});

describe("email nudge at 3 reporters", () => {
  it("does not email for one or two reports", async () => {
    stubEmail();
    const { env } = makeEnv({ materials: mats() });
    await report(env, { ip: "1.1.1.1" });
    await report(env, { ip: "2.2.2.2" });
    expect(emails).toHaveLength(0);
  });

  it("emails the moderator when a third different person reports a published file", async () => {
    stubEmail();
    const { env } = makeEnv({ materials: mats() });
    for (const ip of ["1.1.1.1", "2.2.2.2", "3.3.3.3"]) await report(env, { ip });
    expect(emails).toHaveLength(1);
    expect(emails[0].to).toBe(MOD);
    expect(emails[0].subject).toMatch(/3 raporte/);
    expect(emails[0].html).toMatch(/3 persona/);
    expect(emails[0].html).toMatch(/\/llogaria\/moderim\?tab=raportet/);
  });

  it("escapes the file's title in the email", async () => {
    stubEmail();
    const { env } = makeEnv({ materials: mats() });
    for (const ip of ["1.1.1.1", "2.2.2.2", "3.3.3.3"]) await report(env, { ip });
    expect(emails[0].html).toContain("&lt;b&gt;");
    expect(emails[0].html).not.toContain("<b>");
  });

  it("sends one email, not one per further report", async () => {
    stubEmail();
    const { env } = makeEnv({ materials: mats() });
    for (const ip of ["1.1.1.1", "2.2.2.2", "3.3.3.3", "4.4.4.4", "5.5.5.5"]) await report(env, { ip });
    expect(emails).toHaveLength(1);
  });

  it("does not email for a file that is not published", async () => {
    stubEmail();
    const m = mats(); m[7].status = "pending";
    const { env } = makeEnv({ materials: m });
    for (const ip of ["1.1.1.1", "2.2.2.2", "3.3.3.3"]) await report(env, { ip });
    expect(emails).toHaveLength(0);
  });

  it("keeps the report and lets the hourly job retry if the email fails", async () => {
    stubEmail(false);
    const { env, reports, alerts } = makeEnv({ materials: mats() });
    for (const ip of ["1.1.1.1", "2.2.2.2", "3.3.3.3"]) await report(env, { ip });
    expect(reports).toHaveLength(3);
    expect(alerts.get(7).notified_at).toBeNull();

    stubEmail(true);
    const { sent } = await sendReportAlerts(env);
    expect(sent).toBe(1);
    expect(emails[0].to).toBe(MOD);
    expect(alerts.get(7).notified_at).not.toBeNull();
  });
});

describe("daily reminder", () => {
  const flagged = () => {
    const reports = ["a:1", "a:2", "a:3"].map((k, i) => ({ id: i + 1, material_id: 7, reporter_key: k, reason: "Tjetër", status: "pending" }));
    return reports;
  };

  it("reminds once a day while the file is still published and flagged", async () => {
    stubEmail();
    const alerts = new Map([[7, { notified_at: "2026-10-10 08:00:00", reminded_at: null }]]);
    const { env } = makeEnv({ materials: mats(), reports: flagged(), alerts });
    const now = new Date("2026-10-11T09:00:00Z");

    expect((await sendReportAlerts(env, now)).sent).toBe(1);
    expect(emails[0].subject).toMatch(/Kujtesë/);
    // the reminder time is recorded, so an immediate re-run stays quiet
    alerts.get(7).reminded_at = "2026-10-11 09:00:00";
    emails.length = 0;
    expect((await sendReportAlerts(env, new Date("2026-10-11T10:00:00Z"))).sent).toBe(0);
    expect(emails).toHaveLength(0);
  });

  it("does not remind within 24 hours of the first nudge", async () => {
    stubEmail();
    const alerts = new Map([[7, { notified_at: "2026-10-11 08:00:00", reminded_at: null }]]);
    const { env } = makeEnv({ materials: mats(), reports: flagged(), alerts });
    expect((await sendReportAlerts(env, new Date("2026-10-11T20:00:00Z"))).sent).toBe(0);
  });

  it("stops once the reports are handled", async () => {
    stubEmail();
    const reports = flagged().map((r) => ({ ...r, status: "dismissed" }));
    const alerts = new Map([[7, { notified_at: "2026-10-10 08:00:00", reminded_at: null }]]);
    const { env } = makeEnv({ materials: mats(), reports, alerts });
    expect((await sendReportAlerts(env, new Date("2026-10-12T09:00:00Z"))).sent).toBe(0);
  });
});

describe("handling reports", () => {
  it("forgets the alert once a file drops below 3 open reporters, so a new wave nudges again", async () => {
    stubEmail();
    const reports = ["a:1", "a:2", "a:3"].map((k, i) => ({ id: i + 1, material_id: 7, reporter_key: k, reason: "Tjetër", status: "pending" }));
    const alerts = new Map([[7, { notified_at: "2026-10-10 08:00:00", reminded_at: null }]]);
    const { env } = makeEnv({ email: MOD, materials: mats(), reports, alerts });
    // signed-in as the moderator
    const call = async (id) =>
      worker.fetch(
        new Request("https://api.e-studenti.com/?action=resolve-report", {
          method: "POST",
          headers: { Origin: "https://e-studenti.com", Cookie: `srh_token=${await token()}`, "Content-Type": "application/json" },
          body: JSON.stringify({ report_id: id, action: "dismiss" }),
        }),
        env
      );
    await call(1); // 2 open people left: below the threshold
    expect(alerts.has(7)).toBe(false);
  });
});

describe("unpublishing and trust", () => {
  const post = async (env, action, body) =>
    worker.fetch(
      new Request(`https://api.e-studenti.com/?action=${action}`, {
        method: "POST",
        headers: { Origin: "https://e-studenti.com", Cookie: `srh_token=${await token()}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      env
    );

  it("only the moderator can unpublish, and only a published file", async () => {
    const m = mats();
    expect((await post(makeEnv({ materials: m }).env, "unpublish-material", { id: 7 })).status).toBe(401);
    const { env } = makeEnv({ email: MOD, materials: m });
    expect((await post(env, "unpublish-material", { id: 7 })).status).toBe(200);
    expect(m[7].status).toBe("pending");
    expect((await post(env, "unpublish-material", { id: 7 })).status).toBe(404);
  });

  it("only the moderator can withdraw trust", async () => {
    const trusted = {};
    expect((await post(makeEnv({ trusted }).env, "set-user-trust", { user_id: 5, revoked: true })).status).toBe(401);
    const { env } = makeEnv({ email: MOD, trusted });
    expect((await post(env, "set-user-trust", { user_id: 5, revoked: true })).status).toBe(200);
    expect(trusted[5]).toBe(1);
  });
});

describe("the trusted mark", () => {
  it("shows on a named upload and never on an anonymous one", () => {
    const named = sanitizeMaterialForPublic({ id: 1, uploader_name: "Ana", uploader_trusted: 1, is_anonymous: 0 });
    const anonymous = sanitizeMaterialForPublic({ id: 2, uploader_name: "Ana", uploader_trusted: 1, is_anonymous: 1 });
    expect(named.uploader_trusted).toBe(1);
    expect("uploader_trusted" in anonymous).toBe(false);
  });
});
