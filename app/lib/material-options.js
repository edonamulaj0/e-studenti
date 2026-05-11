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

const FACULTY_NAMES_BY_CODE = Object.fromEntries(
  FACULTIES.map((faculty) => [faculty.code, faculty.name])
);

export function getFacultyName(value) {
  const code = String(value || "").trim().toUpperCase();
  return FACULTY_NAMES_BY_CODE[code] || value || "";
}

export const MATERIAL_TYPES = ["Ligjerata", "Afat", "Projekt", "Libër", "Të tjera"];
