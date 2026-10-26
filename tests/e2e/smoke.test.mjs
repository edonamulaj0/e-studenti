/**
 * Browser smoke tests against the production build, served like Cloudflare
 * Pages with the real public/_headers (scripts/serve-static.mjs) and the stub
 * API. They catch what unit tests cannot: a page that no longer hydrates, a
 * script the CSP blocks, a navbar that wraps, horizontal scroll on phones.
 *
 *   node --test tests/e2e/*.test.mjs   (E2E_URL defaults to http://127.0.0.1:4180;
 *   CHROMIUM_PATH names a browser when Playwright's own is not installed)
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { chromium } from "playwright";

const BASE = process.env.E2E_URL || "http://127.0.0.1:4180";
const PAGES = [
  "/",
  "/materialet",
  "/materialet/anatomia-1-med",
  "/lenda/anatomi-med",
  "/kerkesat",
  "/universitetet",
  "/fakultetet/fiek",
  "/llogaria/hyr",
  "/privatesia",
  "/erasmus",
  "/nuk-ekziston",
];

let browser;
before(async () => {
  // CI installs the browser that matches this Playwright; elsewhere one can be named.
  browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
  );
});
after(async () => {
  await browser?.close();
});

/** Opens a page and collects everything that went wrong while it loaded. */
async function open(path, viewport = { width: 1280, height: 900 }) {
  const page = await browser.newPage({ viewport });
  const problems = [];
  page.on("pageerror", (error) => problems.push(`page error: ${error.message}`));
  page.on("console", (message) => {
    const text = message.text();
    // The stub's materials point at files that do not exist, so their previews fail by design.
    if (message.type() === "error" && !/Failed to load resource|PDF render error/.test(text)) {
      problems.push(`console: ${text.slice(0, 200)}`);
    }
  });
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  return { page, problems };
}

describe("every page", () => {
  for (const path of PAGES) {
    it(`${path} loads, hydrates and breaks no CSP rule`, async () => {
      const { page, problems } = await open(path);
      // Only a hydrated page switches language.
      await page.click('button:has-text("EN")');
      await page.waitForFunction(() => document.documentElement.lang === "en", null, { timeout: 5000 });
      assert.deepEqual(problems, []);
      await page.close();
    });
  }
});

describe("security headers", () => {
  it("an inline script injected at runtime is refused", async () => {
    const { page } = await open("/");
    const ran = await page.evaluate(async () => {
      const script = document.createElement("script");
      script.textContent = "window.__injected = true";
      document.body.append(script);
      await new Promise((resolve) => setTimeout(resolve, 50));
      return window.__injected === true;
    });
    assert.equal(ran, false);
    await page.close();
  });

  it("link previews point at PNG images that are served as images", async () => {
    const { page } = await open("/materialet/anatomia-1-med");
    const image = await page.getAttribute('meta[property="og:image"]', "content");
    assert.match(image, /\/opengraph-image\.png\?/);
    const response = await page.request.get(BASE + new URL(image).pathname);
    assert.equal(response.headers()["content-type"], "image/png");
    await page.close();
  });
});

describe("layout", () => {
  for (const width of [390, 768, 1024, 1280, 1440]) {
    it(`navbar and pages fit at ${width}px`, async () => {
      const { page } = await open("/", { width, height: 900 });
      const layout = await page.evaluate(() => {
        const bar = document.querySelector("div.relative.mx-auto.flex");
        const wrapped = [...bar.querySelectorAll("a, button")].filter(
          (el) => el.offsetParent && el.getBoundingClientRect().height > 52
        );
        return {
          barOverflows: bar.scrollWidth > bar.clientWidth,
          wrapped: wrapped.map((el) => el.textContent.trim()),
          pageScrollsSideways: document.documentElement.scrollWidth > window.innerWidth,
        };
      });
      assert.deepEqual(layout, { barOverflows: false, wrapped: [], pageScrollsSideways: false });
      await page.close();
    });
  }
});

describe("materials", () => {
  it("can be marked useful from their page", async () => {
    const { page, problems } = await open("/materialet/anatomia-1-med");
    const useful = page.locator('button[aria-label="Po, më ndihmoi"]');
    await useful.waitFor({ timeout: 10000 });
    assert.equal((await useful.textContent()).trim(), "2");
    assert.deepEqual(problems, []);
    await page.close();
  });
});

describe("filters", () => {
  it("apply at once, narrow the other lists and show removable chips", async () => {
    const { page, problems } = await open("/materialet");
    const sidebar = page.locator("#filters-desktop");
    await sidebar.getByRole("button", { name: /Fakulteti \/ fusha/i }).click();
    await sidebar.getByRole("radio", { name: /^Fakulteti i Mjekësisë/ }).click();
    const chip = page.locator('ul[aria-label="Filtrat aktivë"] button', { hasText: "Fakulteti i Mjekësisë" });
    await chip.waitFor({ timeout: 10000 });
    await page.getByText("1 materiale", { exact: true }).waitFor({ timeout: 10000 });
    assert.match(page.url(), /faculty=MED/);
    // A UP faculty leaves only UP among the universities.
    assert.equal(await sidebar.getByText("UHZ Pejë").count(), 0);
    await chip.click();
    await page.getByText("2 materiale", { exact: true }).waitFor({ timeout: 10000 });
    assert.equal(await sidebar.getByText("UHZ Pejë").count(), 1);
    assert.deepEqual(problems, []);
    await page.close();
  });

  it("on phones, say how many materials match and close the drawer", async () => {
    const { page, problems } = await open("/materialet", { width: 390, height: 844 });
    await page.getByRole("button", { name: /^Filtrat/ }).click();
    const drawer = page.locator("#filters-mobile");
    await drawer.getByRole("button", { name: /Fakulteti \/ fusha/i }).click();
    await drawer.getByRole("radio", { name: /^Fakulteti i Mjekësisë/ }).click();
    const done = drawer.getByRole("button", { name: "Shiko 1 materiale" });
    await done.waitFor({ timeout: 10000 });
    await done.click();
    assert.equal(await drawer.count(), 0);
    assert.deepEqual(problems, []);
    await page.close();
  });
});

describe("search", () => {
  it("a search with no results offers to request the material", async () => {
    const { page, problems } = await open("/materialet");
    await page.fill('input[type="search"], input[placeholder*="Kërko"]', "kimi organike");
    const cta = page.locator('a:has-text("Kërkojeni")');
    await cta.waitFor({ timeout: 10000 });
    assert.equal(await cta.getAttribute("href"), "/kerkesat?kerko=kimi%20organike");
    assert.deepEqual(problems, []);
    await page.close();
  });
});
