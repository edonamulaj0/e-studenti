#!/usr/bin/env node
/**
 * Locks inline scripts down to the ones the build produced.
 *
 * Next's static export inlines its hydration data (self.__next_f.push(...)) and
 * the theme script, so the site-wide CSP in public/_headers has to allow
 * 'unsafe-inline' for scripts — which would let any HTML injection run. Every
 * page has its own inline scripts (up to ~50, 700+ across the site), too many
 * for one header, so each page gets a <meta> CSP listing the SHA-256 hashes of
 * exactly its own inline scripts. Browsers enforce every policy they are given,
 * so a script must pass both: the header's host rules and this page's hashes.
 *
 * Runs after `next build`, over out/. Fails the build if a page has an inline
 * script it cannot place the policy before.
 */
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve(process.argv[2] || "out");
/** Must match the script-src hosts in public/_headers. */
const SCRIPT_HOSTS = ["'self'", "https://static.cloudflareinsights.com"];

const INLINE_SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
/** Data blocks are never executed, so CSP does not apply to them. */
const DATA_TYPE = /\btype\s*=\s*["']?(application\/(ld\+)?json|application\/json)["']?/i;

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith(".html")) yield full;
  }
}

export function inlineScriptHashes(html) {
  const hashes = new Set();
  for (const [, attrs, body] of html.matchAll(INLINE_SCRIPT)) {
    if (/\bsrc\s*=/i.test(attrs) || DATA_TYPE.test(attrs)) continue;
    hashes.add(`'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`);
  }
  return [...hashes];
}

export function addCspMeta(html) {
  if (html.includes('http-equiv="Content-Security-Policy"')) return { html, count: -1 };
  const hashes = inlineScriptHashes(html);
  const policy = [`script-src ${[...SCRIPT_HOSTS, ...hashes].join(" ")}`, "script-src-attr 'none'"].join("; ");
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy}"/>`;
  // After the charset declaration (which must stay in the first 1024 bytes) and
  // before the first script of any kind.
  const charset = html.match(/<meta charSet="utf-8"\/>|<meta charset="utf-8"\s*\/?>/i);
  if (!charset) throw new Error("no <meta charset> to anchor the CSP after");
  const at = charset.index + charset[0].length;
  const firstScript = html.search(/<script\b/i);
  if (firstScript !== -1 && firstScript < at) throw new Error("a script comes before <meta charset>");
  return { html: html.slice(0, at) + meta + html.slice(at), count: hashes.length };
}

async function main() {
  let seen = 0;
  let pages = 0;
  let most = 0;
  for await (const file of htmlFiles(OUT)) {
    seen += 1;
    const { html, count } = addCspMeta(await readFile(file, "utf8"));
    if (count === -1) continue; // already pinned by an earlier run
    await writeFile(file, html);
    pages += 1;
    most = Math.max(most, count);
  }
  if (seen === 0) throw new Error(`no HTML pages found under ${OUT}`);
  console.log(`csp-inline-hashes: ${pages} of ${seen} pages pinned to their inline scripts (up to ${most} per page).`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`csp-inline-hashes: ${error.message}`);
    process.exit(1);
  });
}
