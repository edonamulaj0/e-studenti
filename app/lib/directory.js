import data from "../data/universities.json";

/** Study levels in the order a student climbs them. */
export const LEVELS = [
  { key: "bachelor", label: "Bachelor" },
  { key: "professional", label: "Bachelor profesional" },
  { key: "integrated", label: "Studime të integruara" },
  { key: "master", label: "Master" },
  { key: "doctorate", label: "Doktoraturë" },
];

const LEVEL_LABELS = Object.fromEntries(LEVELS.map((l) => [l.key, l.label]));
export const levelLabel = (key) => LEVEL_LABELS[key] || "Tjetër";

const SECTOR_LABELS = { public: "Publik", private: "Privat", other: "Tjetër" };
export const sectorLabel = (key) => SECTOR_LABELS[key] || "Tjetër";

export const SOURCE = data.source;
export const universities = data.universities;
export const programmes = data.programmes;

const universityBySlug = new Map(universities.map((u) => [u.slug, u]));
const programmeById = new Map(programmes.map((p) => [p.id, p]));

/** Faculty where the source names one (University of Prishtina), otherwise the study field. */
export const categoryOf = (p) => p.unit || p.field;

export const levelRank = (key) => {
  const i = LEVELS.findIndex((l) => l.key === key);
  return i === -1 ? LEVELS.length : i;
};

const fold = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/**
 * Alphabetical order that is the same in Node (static build) and the browser.
 * localeCompare("sq") differs between them, which breaks hydration.
 */
export const compareText = (a, b) => {
  const x = fold(a);
  const y = fold(b);
  return x < y ? -1 : x > y ? 1 : 0;
};

export const getUniversity = (slug) => universityBySlug.get(slug) || null;
export const getProgramme = (id) => programmeById.get(id) || null;
export const programmesOf = (slug) => programmes.filter((p) => p.uni === slug);

/** Programme counts per level for one university, in LEVELS order. */
export function levelCounts(slug) {
  const counts = {};
  for (const p of programmesOf(slug)) counts[p.level] = (counts[p.level] || 0) + 1;
  return LEVELS.filter((l) => counts[l.key]).map((l) => ({ ...l, count: counts[l.key] }));
}

/** Nominal length from credits: 60 ECTS is one year. */
export function durationLabel(ects, t = (s) => s) {
  const years = ects / 60;
  const shown = Number.isInteger(years) ? String(years) : years.toFixed(1);
  return `${shown} ${t(years === 1 ? "vit" : "vjet")}`;
}

const MONTHS = ["janar", "shkurt", "mars", "prill", "maj", "qershor", "korrik", "gusht", "shtator", "tetor", "nëntor", "dhjetor"];

/** "2027-09-30" -> "30 shtator 2027" (the browser's sq locale is not always installed). */
export function formatDate(iso, t = (s) => s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  return m ? `${Number(m[3])} ${t(MONTHS[Number(m[2]) - 1])} ${m[1]}` : iso || "—";
}
