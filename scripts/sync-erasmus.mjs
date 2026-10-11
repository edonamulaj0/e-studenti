#!/usr/bin/env node
/**
 * Scrapes https://uni-pr.edu/page.aspx?id=1,39 for Erasmus anchors, optional article body text.
 * Set ERASMUS_SKIP_BODIES=1 to only refresh the listing (faster).
 *
 * Cookies: erasmus-cookies.json or ERASMUS_COOKIES_FILE (Playwright JSON array).
 * Run: npm run sync-erasmus
 */

import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  assignSlugsToCalls,
  isListingOnlyUrl,
} from "../lib/erasmus-slugs.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "app", "data", "erasmus-calls.json");
const LIST_URL = "https://uni-pr.edu/page.aspx?id=1,39";

function loadExisting() {
  try {
    const raw = JSON.parse(fs.readFileSync(OUT, "utf8"));
    if (Array.isArray(raw)) {
      return {
        generatedAt: new Date(0).toISOString(),
        sourceUrl: LIST_URL,
        calls: raw,
      };
    }
    return {
      generatedAt: raw.generatedAt || new Date(0).toISOString(),
      sourceUrl: raw.sourceUrl || LIST_URL,
      calls: raw.calls || [],
    };
  } catch {
    return { generatedAt: new Date(0).toISOString(), sourceUrl: LIST_URL, calls: [] };
  }
}

function normalizeTitle(t) {
  return (t || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function mergePreserveDeepLinks(prevCalls, scraped) {
  const byTitle = new Map(
    prevCalls.map((c) => [normalizeTitle(c.title), c])
  );
  return scraped.map((row) => {
    const old = byTitle.get(normalizeTitle(row.title));
    if (!old) return row;

    const preferNewDeep = row.url && !isListingOnlyUrl(row.url);
    const url = preferNewDeep
      ? row.url
      : !isListingOnlyUrl(old.url)
        ? old.url
        : row.url;

    return {
      ...row,
      url,
      slug: old.slug,
      content: old.content,
      contentFetchedAt: old.contentFetchedAt,
      contentFetchError: old.contentFetchError,
    };
  });
}

async function enrichCallsWithContent(page, calls) {
  const out = [];
  const total = calls.length;
  for (let i = 0; i < calls.length; i++) {
    const call = calls[i];
    const label = `${i + 1}/${total}`;
    if (isListingOnlyUrl(call.url)) {
      console.log(`[${label}] listing URL — skip body: ${call.title.slice(0, 48)}…`);
      out.push(call);
      continue;
    }
    console.log(`[${label}] body: ${call.url}`);
    try {
      await page.goto(call.url, {
        waitUntil: "domcontentloaded",
        timeout: 55000,
      });
      await page.waitForTimeout(1200);
      const raw = await page.evaluate(() => document.body?.innerText || "");
      if (
        /security verification|verify you are not a bot/i.test(raw)
      ) {
        console.warn(`  CF / challenge on detail — keep previous content`);
        out.push(call);
        continue;
      }
      const text = await page.evaluate(() => {
        const el =
          document.querySelector(
            'main, article, #content, .content, [role="main"], #MainContent, #ctl00_mainContent, .page-content, .post-content'
          ) || document.body;
        return (el?.innerText || "")
          .replace(/\t/g, " ")
          .replace(/[ \t]+\n/g, "\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
      });
      const { contentFetchError: _err, ...rest } = call;
      out.push({
        ...rest,
        content: text.slice(0, 25000),
        contentFetchedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn(`  ${e.message}`);
      out.push({
        ...call,
        contentFetchError: String(e.message).slice(0, 200),
      });
    }
    await page.waitForTimeout(350);
  }
  return out;
}

async function scrapeWithPlaywright() {
  const cookiesPath =
    process.env.ERASMUS_COOKIES_FILE ||
    path.join(ROOT, "erasmus-cookies.json");

  const browser = await chromium.launch({
    headless: process.env.ERASMUS_HEADFUL === "1" ? false : true,
  });

  const context = await browser.newContext({
    locale: "sq-AL",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
  });

  if (fs.existsSync(cookiesPath)) {
    try {
      const raw = fs.readFileSync(cookiesPath, "utf8").trim();
      if (raw) {
        const cookies = JSON.parse(raw);
        if (Array.isArray(cookies) && cookies.length) {
          await context.addCookies(cookies);
          console.log(`Loaded cookies from ${cookiesPath}`);
        }
      }
    } catch (e) {
      console.warn("Could not load cookies file:", e.message);
    }
  }

  const page = await context.newPage();
  await page.goto(LIST_URL, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });

  for (let i = 0; i < 40; i++) {
    const text = await page.evaluate(() => document.body?.innerText || "");
    if (/erasmus/i.test(text) && !/security verification/i.test(text)) {
      break;
    }
    if (/Performing security verification/i.test(text)) {
      await page.waitForTimeout(2000);
      continue;
    }
    await page.waitForTimeout(1500);
  }

  const blocked = await page.evaluate(() => {
    const t = document.body?.innerText || "";
    return (
      /security verification/i.test(t) ||
      /verify you are not a bot/i.test(t)
    );
  });

  if (blocked) {
    await browser.close();
    return { ok: false, calls: [], reason: "cloudflare_or_challenge" };
  }

  const rows = await page.evaluate((baseOrigin) => {
    const BASE = baseOrigin;
    const out = [];
    const seen = new Set();

    function parseDateFromText(txt) {
      const m = txt.match(/\b(\d{2})\.(\d{2})\.(\d{4})\b/);
      if (!m) return "";
      return `${m[3]}-${m[2]}-${m[1]}`;
    }

    const anchors = document.querySelectorAll('a[href*="page.aspx"]');
    anchors.forEach((a) => {
      let href = a.getAttribute("href");
      if (!href || href.startsWith("#") || /javascript:/i.test(href)) return;

      let title = (a.textContent || "").replace(/\s+/g, " ").trim();
      if (title.length < 8) {
        const h = a.querySelector("h5, h4, h3, .title, strong");
        if (h) title = (h.textContent || "").replace(/\s+/g, " ").trim();
      }
      if (!/erasmus/i.test(title)) return;

      let abs;
      try {
        abs = new URL(href, BASE).href;
      } catch {
        return;
      }

      const key = `${abs}|||${title}`;
      if (seen.has(key)) return;
      seen.add(key);

      let date = "";
      const block =
        a.closest("tr, li, article, .row, [class*='news'], [class*='item']") ||
        a.parentElement?.parentElement;
      if (block) {
        date = parseDateFromText(block.innerText || "");
      }

      out.push({ title, url: abs, date });
    });

    return out;
  }, "https://uni-pr.edu");

  if (!rows.length) {
    await browser.close();
    return { ok: false, calls: [], reason: "no_rows" };
  }

  rows.sort((a, b) => {
    const da = a.date || "";
    const db = b.date || "";
    return db.localeCompare(da);
  });

  const existing = loadExisting();
  let calls = mergePreserveDeepLinks(existing.calls, rows);
  calls = assignSlugsToCalls(calls);

  if (process.env.ERASMUS_SKIP_BODIES !== "1") {
    console.log("Fetching article bodies (set ERASMUS_SKIP_BODIES=1 to skip)…");
    calls = await enrichCallsWithContent(page, calls);
  }

  await browser.close();
  return { ok: true, calls };
}

async function main() {
  console.log(`Output: ${OUT}`);

  const result = await scrapeWithPlaywright();

  if (!result.ok || !result.calls?.length) {
    console.warn(
      `Scrape failed (${result.reason || "unknown"}). Keeping ${OUT} unchanged.`
    );
    console.warn(
      "Tips: ERASMUS_HEADFUL=1 npm run sync-erasmus, or erasmus-cookies.json after passing CF in browser."
    );
    process.exit(0);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceUrl: LIST_URL,
    calls: result.calls,
  };

  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
  console.log(`Wrote ${result.calls.length} calls to ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
