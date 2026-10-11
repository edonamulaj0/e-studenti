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

/** Study fields, matched in order against the programme names (English and Albanian). */
const FIELD_RULES = [
  ["Biznes & Ekonomi", /(economics engineering|inxhinieri ekonomike|business administration|administrim biznesi|economic analysis|analizat ekonomike)/],
  ["Drejtësi", /\b(law|juridik|legislation|e drejta|rule of law|sundim i ligjit)\b/],
  ["Shëndetësi & Mjekësi", /(nurs|infermier|health|shendet|pharm|farmaci|dental|dentist|stomatolog|physio|fizioterapi|radiolog|laborator|medical|mjeksor|paramed|speech|logoped|ergoter|cosmetolog|kozmetolog|aesthetic|estetik|nutrition|nutricion|biomedic|biomjek|medicine|mjekesi)/],
  ["Sport & Aktivitet Fizik", /(\bsports?\b|\bsporti?\b|physical education|kulture fizike|fitness|movement|levizjes)/],
  ["Edukim", /(education|edukim|teaching|mesimdhenie|preschool|parashkollor|primary|fillor|curriculum|kurrikul)/],
  ["Informatikë & Teknologji", /(computer|kompjuter|informatic|informatik|software|softuer|programming|programim|programing|cyber|kibernet|data science|cloud|artificial intelligence|inteligjenc|information (system|tech)|sistemet e informacionit|e-governance|telecommunication|telekomunik|control systems)/],
  ["Arkitekturë & Ndërtimtari", /(architect|arkitektur|civil engineer|ndertim|spatial|hapsinor|real estate|patundshmeri|infrastructure|infrastruktur|spatial design)/],
  ["Arte & Dizajn", /(design|dizajn|fashion|\bmoda\b|\bmode\b|painting|pikture|music|muzik|performing|performues|dramatic|dramatike|visual arts|\barts?\b|\barte\b|styling|stilizem|media production|produksion medial|digital media|multimedia)/],
  ["Inxhinieri & Industri", /(mechanic|mekanik|mechatronic|mekatronik|energy|energji|mining|minerar|miniera|manufactur|prodhues|traffic|transport|electrical|elektrik|material|metalurg|industrial|industriale|hydrogeolog|geology engineering|gjeologji inxhinierike|geodesy|gjeodezi|hydrotechn|hidroteknik|construction|konstruktiv|power systems|elektroenergjet|electronics|elektronik|automation|robotics|automatik)/],
  ["Bujqësi, Ushqim & Mjedis", /(agri|agro|food|ushqim|forest|pyje|pyjor|plant production|bimor|animal|zootekni|pomology|pemetari|viticulture|vreshtari|plant protection|mbrojtje e bimeve|environment|mjedis|ecology|ekolog|veterin)/],
  ["Inxhinieri & Industri", /(engineering|inxhinieri)/],
  ["Shkenca Natyrore", /(chemistry|\bkimi\b|biochem|biokimi|geolog|mineral deposits|vendburimet|physics|\bfizike\b|mathemat|matematik|biology|biologji|geograph|gjeografi)/],
  ["Gjuhë & Humanistikë", /(language|gjuhe|literature|letersi|literary|linguistic|gjuhesi|translation|perkthim|theology|teologji|history|histori|philosoph|filozofi|anthropolog|antropolog|cultural heritage|orientalist|balkanist|oriental|archivist|arkivist)/],
  ["Siguri", /(\bsecurity\b|\bsiguri\b|\bsigurise\b|public safety|emergenc|emergjenc)/],
  ["Shkencat Sociale & Media", /(psycholog|psikolog|political|shkenca politike|politika publike|international relations|marredhenie nderkombetare|media|communication|komunikim|journalis|gazetari|social|sociolog|public policy|public administration|administrate publike|administrim publik|welfare|governance|qeverisje|child care|perkujdesje|european studies|studime europiane)/],
  ["Biznes & Ekonomi", /(business|biznes|management|menaxh|econom|ekonomi|ekonomik|finance|financ|bank|accounting|kontabilitet|marketing|tourism|turiz|hospitality|hotelieri|insurance|sigurim|entrepreneur|ndermarr|fintech|human resource|trade|sales|shitjes|audit|customs|dogan)/],
];
const normalise = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
function fieldOf(nameEn, nameSq) {
  // Parentheses hold languages and specialisations ("in Albanian language"), not the field.
  const text = normalise(`${nameEn} ${nameSq}`.replace(/\([^)]*\)/g, " "));
  for (const [field, re] of FIELD_RULES) if (re.test(text)) return field;
  return "Të tjera";
}

/** "Programim, Bachelor profesional" -> name "Programim"; "X, MSc (me 2 specializime)" -> note "(me 2 specializime)". */
const TAIL = /,?\s*\(?\s*(bachelor\s*prof\w*\.?|professional bachelor|bachelor profesional|bachelor professional|bsc\.?|msc\.?|ba|ma|llb|llm|phd)\b\)?\.?(.*)$/i;
function cleanName(raw) {
  const text = raw.replace(/\s+/g, " ").trim();
  const m = TAIL.exec(text);
  if (!m || m.index === 0) return { name: text.replace(/[.,]+$/, ""), note: "" };
  return { name: text.slice(0, m.index).replace(/[.,\s]+$/, ""), note: m[2].replace(/^[\s,]+|[\s,]+$/g, "") };
}

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

  const sq = cleanName(r.program_sq);
  const en = cleanName(r.program_en);
  const title = sq.name;
  const base = slugify(`${title}-${r.level_norm}-${r.campus}-${unit}`).slice(0, 80);
  const n = (seen.get(`${slug}/${base}`) || 0) + 1;
  seen.set(`${slug}/${base}`, n);
  programmes.push({
    id: `${slug}/${n > 1 ? `${base}-${n}` : base}`,
    uni: slug,
    unit,
    unitCode: UP_FACULTY_CODES[unit] || "",
    name: title,
    nameEn: en.name,
    note: sq.note,
    field: fieldOf(en.name, title),
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
