import { FACULTIES } from "../../shared/material-options.mjs";

export { FACULTIES, MATERIAL_TYPES } from "../../shared/material-options.mjs";

const FACULTY_NAMES_BY_CODE = Object.fromEntries(
  FACULTIES.map((faculty) => [faculty.code, faculty.name])
);

export function getFacultyName(value) {
  const code = String(value || "").trim().toUpperCase();
  return FACULTY_NAMES_BY_CODE[code] || value || "";
}

