#!/usr/bin/env node
/**
 * Next's static export writes link-preview images as extensionless files
 * (…/opengraph-image). Cloudflare Pages picks the Content-Type from the
 * extension, and Facebook, Viber and WhatsApp ignore a preview that is not
 * served as an image. This renames them to …/opengraph-image.png and points
 * every reference (the HTML meta tags and the RSC payloads) at the new name.
 *
 * Runs after `next build` and before csp-inline-hashes.mjs, because the URLs
 * also appear inside inline scripts that get hashed.
 */
import { readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve(process.argv[2] || "out");
const REFERENCE = /\/opengraph-image(?=\?)/g;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

let images = 0;
let pages = 0;
for await (const file of walk(OUT)) {
  if (path.basename(file) === "opengraph-image") {
    await rename(file, `${file}.png`);
    images += 1;
  } else if (file.endsWith(".html") || file.endsWith(".txt")) {
    const text = await readFile(file, "utf8");
    if (!text.includes("/opengraph-image?")) continue;
    await writeFile(file, text.replace(REFERENCE, "/opengraph-image.png"));
    pages += 1;
  }
}
console.log(`og-image-extensions: ${images} preview images renamed to .png, references updated in ${pages} files.`);
