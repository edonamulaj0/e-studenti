import { describe, expect, it } from "vitest";
import {
  buildDedupeKey,
  isBotUserAgent,
} from "./material-stats.js";
import {
  isModeratorEmail,
  parseModeratorEmails,
  userIsModerator,
} from "./moderators.js";
import {
  isStatsPeriodAvailable,
  STATS_PERIOD_LABELS,
} from "./site-stats.js";

describe("moderators", () => {
  it("parses comma-separated moderator emails", () => {
    expect(
      parseModeratorEmails({
        MODERATOR_EMAILS: " One@Example.com , two@example.com ",
      })
    ).toEqual(["one@example.com", "two@example.com"]);
  });

  it("supports legacy MODERATOR_EMAIL env var", () => {
    expect(
      isModeratorEmail("admin@uni-pr.edu", {
        MODERATOR_EMAIL: "admin@uni-pr.edu",
      })
    ).toBe(true);
  });

  it("grants moderator via email list or db flag", () => {
    expect(
      userIsModerator(
        { email: "mod@example.com", is_moderator: 0 },
        { MODERATOR_EMAILS: "mod@example.com" }
      )
    ).toBe(true);
    expect(
      userIsModerator(
        { email: "user@example.com", is_moderator: 1 },
        { MODERATOR_EMAILS: "mod@example.com" }
      )
    ).toBe(true);
  });
});

describe("material-stats", () => {
  it("detects common bot user agents", () => {
    expect(isBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(
      isBotUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
      )
    ).toBe(false);
  });

  it("builds daily dedupe keys for views and weekly keys for downloads", () => {
    const date = new Date("2026-07-07T10:00:00Z");
    expect(buildDedupeKey("view", 12, "abc", date)).toBe("view:12:abc:2026-07-07");
    expect(buildDedupeKey("download", 12, "abc", date)).toBe("download:12:abc:2026-07-06");
  });
});

describe("site-stats periods", () => {
  const now = Date.parse("2026-07-14T12:00:00.000Z");

  it("marks long periods unavailable before enough tracking history exists", () => {
    expect(isStatsPeriodAvailable("7d", "2026-07-07", now)).toBe(true);
    expect(isStatsPeriodAvailable("365d", "2026-07-07", now)).toBe(false);
    expect(isStatsPeriodAvailable("24h", "2026-07-14", now)).toBe(false);
    expect(isStatsPeriodAvailable("24h", "2026-07-13", now)).toBe(true);
  });

  it("exposes Albanian labels for each period", () => {
    expect(STATS_PERIOD_LABELS["7d"]).toBe("7 ditët e fundit");
  });
});
