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

export const FACULTY_CODES = FACULTIES.map((faculty) => faculty.code);

export const MATERIAL_TYPES = ["Provime Pranuese", "Ligjerata", "Afat", "Projekt", "Libër", "Të tjera"];

export const STUDY_LEVELS = [
  { value: "bachelor", label: "Bachelor" },
  { value: "master", label: "Master" },
  { value: "phd", label: "Doktoraturë" },
];

export const STUDY_LEVEL_VALUES = STUDY_LEVELS.map((level) => level.value);
