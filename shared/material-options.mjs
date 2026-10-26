/**
 * The faculties, material types and study levels the catalogue understands.
 * The upload form offers exactly these and the Worker accepts exactly these.
 */

export const FACULTIES = [
  { code: "ART", name: "Fakulteti i Arteve" },
  { code: "ECON", name: "Fakulteti Ekonomik" },
  { code: "EDU", name: "Fakulteti i Edukimit" },
  { code: "FA", name: "Fakulteti i Arkitekturës" },
  { code: "FBV", name: "Fakulteti i Bujqësisë dhe Veterinarisë" },
  { code: "FEFS", name: "Fakulteti i Edukimit Fizik dhe i Sportit" },
  { code: "FFL", name: "Fakulteti Filologjik" },
  { code: "FFZ", name: "Fakulteti Filozofik" },
  { code: "FIEK", name: "Fakulteti i Inxhinierisë Elektrike dhe Kompjuterike" },
  { code: "FIM", name: "Fakulteti i Inxhinierisë Mekanike" },
  { code: "FIN", name: "Fakulteti i Ndërtimtarisë" },
  { code: "FSHMN", name: "Fakulteti i Shkencave Matematike Natyrore" },
  { code: "LAW", name: "Fakulteti Juridik" },
  { code: "MED", name: "Fakulteti i Mjekësisë" },
];

/**
 * Institutions other than the University of Prishtina have no faculty list in the
 * accreditation data, so their materials are filed under a study field instead.
 * A field is stored in the same `faculty` column; the university decides which of
 * the two lists applies (see facultiesFor).
 */
export const FIELDS = [
  { code: "BIZ", name: "Biznes & Ekonomi" },
  { code: "DRJ", name: "Drejtësi" },
  { code: "INF", name: "Informatikë & Teknologji" },
  { code: "ING", name: "Inxhinieri & Industri" },
  { code: "ARK", name: "Arkitekturë & Ndërtimtari" },
  { code: "SHM", name: "Shëndetësi & Mjekësi" },
  { code: "EDK", name: "Edukim" },
  { code: "GJH", name: "Gjuhë & Humanistikë" },
  { code: "SHS", name: "Shkencat Sociale & Media" },
  { code: "DIZ", name: "Arte & Dizajn" },
  { code: "BUJ", name: "Bujqësi, Ushqim & Mjedis" },
  { code: "NAT", name: "Shkenca Natyrore" },
  { code: "SPR", name: "Sport & Aktivitet Fizik" },
  { code: "SIG", name: "Siguri" },
  { code: "TJT", name: "Të tjera" },
];

export const FACULTY_CODES = [...FACULTIES, ...FIELDS].map((faculty) => faculty.code);

/** The University of Prishtina: what every material uploaded before universities were chosen belongs to. */
export const DEFAULT_UNIVERSITY = "universiteti-i-prishtines-hasan-prishtina";

/** Faculties (UP) or fields (everyone else) a material at this university can be filed under. */
export function facultiesFor(universitySlug) {
  return universitySlug === DEFAULT_UNIVERSITY ? FACULTIES : FIELDS;
}

export const MATERIAL_TYPES = ["Provime Pranuese", "Ligjerata", "Afat", "Shënime", "Projekt", "Libër", "Të tjera"];

export const STUDY_LEVELS = [
  { value: "bachelor", label: "Bachelor" },
  { value: "master", label: "Master" },
  { value: "phd", label: "Doktoraturë" },
];

export const STUDY_LEVEL_VALUES = STUDY_LEVELS.map((level) => level.value);
