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
  periodHasPreTrackingGap,
  STATS_PERIOD_LABELS,
  TRACKING_SINCE_DATE,
  TRACKING_SINCE_LABEL,
} from "./site-stats.js";

describe("moderators", () => {
  it("has exactly one moderator", () => {
    expect(parseModeratorEmails()).toEqual(["edonaamulaj@gmail.com"]);
  });

  it("matches that address case-insensitively and nothing else", () => {
    expect(isModeratorEmail("Edonaamulaj@Gmail.com")).toBe(true);
    expect(isModeratorEmail(" edonaamulaj@gmail.com ")).toBe(true);
    expect(isModeratorEmail("edonaamulaj+x@gmail.com")).toBe(false);
    expect(isModeratorEmail("edonaamulaj@gmail.com.evil.com")).toBe(false);
    expect(isModeratorEmail("")).toBe(false);
  });

  it("ignores the database flag and the old environment variables", () => {
    expect(userIsModerator({ email: "user@example.com", is_moderator: 1 })).toBe(false);
    expect(
      userIsModerator({ email: "mod@example.com", is_moderator: 0 }, { MODERATOR_EMAILS: "mod@example.com" })
    ).toBe(false);
    expect(userIsModerator({ email: "edonaamulaj@gmail.com", is_moderator: 0 })).toBe(true);
    expect(userIsModerator(null)).toBe(false);
  });
});

describe("material-stats", () => {
  it("detects common bot user agents", () => {
    expect(isBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBotUserAgent("curl/8.5.0")).toBe(true);
    expect(isBotUserAgent("")).toBe(true);
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

  it("detects when a period extends before tracking launch", () => {
    expect(periodHasPreTrackingGap("7d", TRACKING_SINCE_DATE, now)).toBe(false);
    expect(periodHasPreTrackingGap("365d", TRACKING_SINCE_DATE, now)).toBe(true);
    expect(periodHasPreTrackingGap("24h", TRACKING_SINCE_DATE, now)).toBe(false);
  });

  it("exposes fixed Albanian launch label", () => {
    expect(TRACKING_SINCE_LABEL).toBe("7 KORRIK 2026");
    expect(STATS_PERIOD_LABELS["7d"]).toBe("7 ditët e fundit");
  });
});
