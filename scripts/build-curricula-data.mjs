#!/usr/bin/env node
/**
 * Builds app/data/courses.json (course lists keyed by directory programme id) from the
 * CSVs in docs/directory/phase1. Run it when those change:
 *   node scripts/build-curricula-data.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dir = path.join(root, "docs/directory/phase1");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (ch !== "\r") cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

const read = (name) => parseCsv(fs.readFileSync(path.join(dir, name), "utf8"));
const programmes = JSON.parse(fs.readFileSync(path.join(root, "app/data/universities.json"), "utf8")).programmes;
const knownIds = new Set(programmes.map((p) => p.id));

// One candidate list per (source group, directory id); the longest wins, Bosnian copies lose.
const candidates = new Map();
function offer(id, entry) {
  if (!knownIds.has(id)) return;
  const best = candidates.get(id);
  if (!best || entry.score > best.score) candidates.set(id, entry);
}

function groupBy(rows, keyOf) {
  const map = new Map();
  for (const r of rows) {
    const key = keyOf(r);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  }
  return map;
}

const compact = (r) => [
  r.year ? Number(r.year) : null,
  r.semester ? Number(r.semester) : null,
  r.name.replace(/\s+/g, " ").trim(),
  r.ects ? Number(r.ects) : null,
  r.type || "",
];

// UBT: one list per programme page and campus, attached to every campus match.
for (const [, rows] of groupBy(read("ubt-courses.csv"), (r) => `${r.programme}|${r.campus}`)) {
  const ids = rows[0].directory_ids.split("|").filter(Boolean);
  const courses = rows.filter((r) => r.name).map(compact);
  if (!courses.length) continue;
  for (const id of ids) offer(id, { source: rows[0].source, courses, score: courses.length, method: "UBT" });
}

// Peja and Mitrovica: one list per document, attached to the best-matching programme only.
for (const inst of ["peja", "mitrovica"]) {
  const docs = read(`${inst}-documents.csv`);
  const status = new Map(docs.map((d) => [d.document, d.status]));
  for (const [doc, rows] of groupBy(read(`${inst}-courses.csv`), (r) => r.doc)) {
    const id = rows[0].directory_ids.split("|").filter(Boolean)[0];
    const courses = rows.filter((r) => r.name).map(compact);
    if (!id || !courses.length) continue;
    // Bosnian translations of the Albanian documents are not offered.
    const bosnian = /^(Sadrzaj|Menadzment|Menadz)/i.test(doc);
    offer(id, { source: rows[0].source, courses, score: courses.length - (bosnian ? 1000 : 0), method: status.get(doc) });
  }
}

// Gjakova, Prizren, Ferizaj: one list per page or document, attached to its matched programme.
for (const inst of ["gjakova", "prizren", "ferizaj"]) {
  const groups = groupBy(read(`${inst}-courses.csv`).filter((r) => r.directory_ids), (r) => `${r.directory_ids}|${r.source}|${r.title}`);
  for (const [, rows] of groups) {
    const id = rows[0].directory_ids.split("|")[0];
    const courses = rows.filter((r) => r.name).map(compact);
    if (courses.length) offer(id, { source: rows[0].source, courses, score: courses.length, method: inst });
  }
}

// Small colleges (Universum, AAB, AMECC Rezonanca): one list per page or handbook, matched to its programme.
for (const inst of ["universum", "aab", "amecc"]) {
  const groups = groupBy(read(`${inst}-courses.csv`).filter((r) => r.directory_ids), (r) => `${r.directory_ids}|${r.source}`);
  for (const [, rows] of groups) {
    for (const id of rows[0].directory_ids.split("|").filter(Boolean)) {
      const courses = rows.filter((r) => r.name).map(compact);
      if (courses.length) offer(id, { source: rows[0].source, courses, score: courses.length, method: inst });
    }
  }
}

const out = {};
for (const [id, e] of candidates) {
  out[id] = { source: e.source, namesOnly: e.courses.every((c) => c[3] == null), courses: e.courses };
}
fs.writeFileSync(path.join(root, "app/data/courses.json"), JSON.stringify(out));
const total = Object.values(out).reduce((n, v) => n + v.courses.length, 0);
console.log(`${Object.keys(out).length} programmes with course lists, ${total} courses, of ${programmes.length} programmes`);
