#!/usr/bin/env node
/**
 * Builds app/data/universities.json from the AKA accredited-programme table
 * (docs/directory/phase0/aka-programmes-2026.csv). Run it when that CSV changes:
 *   node scripts/build-directory-data.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { slugify } from "../shared/material-slug.mjs";

const root = process.cwd();
const csv = fs.readFileSync(path.join(root, "docs/directory/phase0/aka-programmes-2026.csv"), "utf8");

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

const LEVEL_GROUPS = {
  BA: "bachelor", BSc: "bachelor", LLB: "bachelor", BMus: "bachelor",
  "Bachelor profesional": "professional",
  "Dr. Dent": "integrated", "Dr. Med": "integrated", DMV: "integrated",
  MA: "master", MSc: "master", LLM: "master", MMus: "master", MPh: "master",
  PhD: "doctorate",
};

// Institutions that are neither a public university nor a private college.
const SECTOR_OVERRIDES = { "Fakulteti i Studimeve Islame": "other" };

const UP_FACULTY_CODES = {
  "Fakulteti Filozofik": "FFZ",
  "Fakulteti i Shkencave Matematike Natyrore": "FSHMN",
  "Fakulteti i Filologjisë": "FFL",
  "Fakulteti Juridik": "LAW",
  "Fakulteti Ekonomik": "ECON",
  "Fakulteti i Inxhinerisë Ndërtimore": "FIN",
  "Fakulteti i Inxhinierisë Elektrike dhe Kompjuterike": "FIEK",
  "Fakulteti i Inxhinierisë Mekanike": "FIM",
  "Fakulteti i Mjekësisë": "MED",
  "Fakulteti i Arteve": "ART",
  "Fakulteti i Bujqësisë dhe Veterinarisë": "FBV",
  "Fakulteti i Edukimit Fizik dhe i Sportit": "FEFS",
  "Fakulteti i Edukimit": "EDU",
  "Fakulteti i Arkitekturës": "FA",
};

const rows = parseCsv(csv);
const universities = new Map();
const programmes = [];
const seen = new Map();

for (const r of rows) {
  const name = r.institution.replace(/\s+/g, " ").trim();
  const slug = slugify(name.replace(/"/g, ""));
  if (!universities.has(slug)) {
    universities.set(slug, {
      slug,
      name,
      sector: SECTOR_OVERRIDES[name] || (r.sector === "public" ? "public" : "private"),
      cities: new Set(),
      units: new Set(),
    });
  }
  const uni = universities.get(slug);
  uni.cities.add(r.campus);
  const unit = name.startsWith("Universiteti i Prishtinës") ? r.unit_or_branch : "";
  if (unit) uni.units.add(unit);

  const title = r.program_sq.replace(/,?\s*(BA|BSc|MSc|MA|LLM|LLB|PhD|MMus|BMus|MPh|Dr\.? ?Dent\.?|Dr\.? ?Med\.?|DMV)\s*$/i, "").trim();
  const base = slugify(`${title}-${r.level_norm}-${r.campus}-${unit}`).slice(0, 80);
  const n = (seen.get(`${slug}/${base}`) || 0) + 1;
  seen.set(`${slug}/${base}`, n);
  programmes.push({
    id: `${slug}/${n > 1 ? `${base}-${n}` : base}`,
    uni: slug,
    unit,
    unitCode: UP_FACULTY_CODES[unit] || "",
    name: title,
    nameEn: r.program_en.replace(/,?\s*(BA|BSc|MSc|MA|LLM|LLB|PhD|MMus|BMus|MPh|Dr\.? ?Dent\.?|Dr\.? ?Med\.?|DMV)\s*$/i, "").trim(),
    degree: r.level_norm,
    level: LEVEL_GROUPS[r.level_norm] || "other",
    ects: Number(r.ects),
    quota: Number(r.quota) || null,
    campus: r.campus,
    until: r.accredited_until,
  });
}

const out = {
  source: "Kosovo Accreditation Agency, list of accredited programmes 2026",
  universities: [...universities.values()].map((u) => ({
    slug: u.slug,
    name: u.name,
    sector: u.sector,
    cities: [...u.cities].sort((a, b) => a.localeCompare(b, "sq")),
    units: [...u.units],
    programmeCount: programmes.filter((p) => p.uni === u.slug).length,
  })).sort((a, b) => (a.sector === "public" ? 0 : 1) - (b.sector === "public" ? 0 : 1) || b.programmeCount - a.programmeCount),
  programmes,
};

fs.mkdirSync(path.join(root, "app/data"), { recursive: true });
fs.writeFileSync(path.join(root, "app/data/universities.json"), JSON.stringify(out));
console.log(`${out.universities.length} universities, ${programmes.length} programmes`);
