#!/usr/bin/env node
/**
 * Serves the static export like Cloudflare Pages does, for the browser tests:
 * /x -> x.html, /x/ -> x/index.html, unknown paths -> 404.html, and the "/*"
 * headers from public/_headers (so the real CSP is enforced). Requests under
 * /api/ are answered by the stub API in this same process, which keeps the
 * API same-origin and inside connect-src 'self' without loosening the policy.
 *
 *   node scripts/serve-static.mjs [outDir=out] [port=4180]
 */
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { handleStubApi } from "./stub-api.mjs";

const [root = "out", port = "4180"] = process.argv.slice(2);
const ROOT = path.resolve(root);

function globalHeaders() {
  const headers = {};
  let inGlobal = false;
  const file = path.resolve("public/_headers");
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (/^\S/.test(line)) inGlobal = line.trim() === "/*";
    else if (inGlobal && line.includes(":")) {
      const at = line.indexOf(":");
      headers[line.slice(0, at).trim()] = line.slice(at + 1).trim();
    }
  }
  return headers;
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
};

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/api/") || url.pathname === "/api") {
      handleStubApi(req, res);
      return;
    }
    const pathname = decodeURIComponent(url.pathname);
    const candidates = [pathname, `${pathname}.html`, path.join(pathname, "index.html")];
    let file = candidates
      .map((candidate) => path.join(ROOT, candidate))
      .find((candidate) => candidate.startsWith(ROOT) && existsSync(candidate) && statSync(candidate).isFile());
    let status = 200;
    if (!file) {
      file = path.join(ROOT, "404.html");
      status = 404;
    }
    res.writeHead(status, { ...globalHeaders(), "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    createReadStream(file).pipe(res);
  })
  .listen(Number(port), "127.0.0.1", () => console.log(`serving ${ROOT} on http://127.0.0.1:${port} (api: stub)`));
