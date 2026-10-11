import { FACULTIES, FIELDS } from "../../shared/material-options.mjs";

export {
  FACULTIES,
  FIELDS,
  MATERIAL_TYPES,
  DEFAULT_UNIVERSITY,
  facultiesFor,
} from "../../shared/material-options.mjs";

const FACULTY_NAMES_BY_CODE = Object.fromEntries(
  [...FACULTIES, ...FIELDS].map((faculty) => [faculty.code, faculty.name])
);

export function getFacultyName(value) {
  const code = String(value || "").trim().toUpperCase();
  return FACULTY_NAMES_BY_CODE[code] || value || "";
}

