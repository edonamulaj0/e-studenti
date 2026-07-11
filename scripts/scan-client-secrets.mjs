#!/usr/bin/env node
/**
 * Fail the build if likely secrets appear in client JS chunks.
 * Scans only app-specific chunks (excludes Next.js framework bundles).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const CHUNK_DIRS = [
  join(ROOT, "out/_next/static/chunks/app"),
  join(ROOT, ".next/static/chunks/app"),
];

const HIGH_RISK =
  /AKIA[0-9A-Z]{16}|sk_live_[A-Za-z0-9]{20,}|SG\.[A-Za-z0-9_-]{20,}|re_[A-Za-z0-9]{20,}|whsec_[A-Za-z0-9]{20,}/g;

const SUSPICIOUS =
  /(?:api[_-]?key|secret[_-]?key|private[_-]?key)\s*[:=]\s*["'][A-Za-z0-9+/=_-]{16,}["']/gi;

function walkJsFiles(dir, files = []) {
  if (!statSync(dir, { throwIfNoEntry: false })) return files;
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) walkJsFiles(path, files);
    else if (entry.endsWith(".js")) files.push(path);
  }
  return files;
}

function scanFile(filePath) {
  const content = readFileSync(filePath, "utf8");
  const findings = [];

  for (const match of content.matchAll(HIGH_RISK)) {
    findings.push({ pattern: "high-risk", match: match[0] });
  }

  for (const match of content.matchAll(SUSPICIOUS)) {
    findings.push({ pattern: "suspicious-assignment", match: match[0].slice(0, 80) });
  }

  return findings;
}

const chunkDirs = CHUNK_DIRS.filter((dir) => statSync(dir, { throwIfNoEntry: false }));
if (chunkDirs.length === 0) {
  console.warn("scan-client-secrets: no client chunk output found; run next build first.");
  process.exit(0);
}

let failed = false;
for (const dir of chunkDirs) {
  for (const file of walkJsFiles(dir)) {
    const findings = scanFile(file);
    if (findings.length === 0) continue;
    failed = true;
    console.error(`\nPossible secret in ${file.replace(ROOT + "/", "")}:`);
    for (const finding of findings) {
      console.error(`  [${finding.pattern}] ${finding.match}`);
    }
  }
}

if (failed) {
  console.error("\nscan-client-secrets: aborting — rotate any exposed credentials and rebuild.");
  process.exit(1);
}

console.log("scan-client-secrets: no high-risk secrets found in client app chunks.");
