import { DEFAULT_UNIVERSITY, facultiesFor } from "./material-options.mjs";
import { UNIVERSITIES } from "./universities.mjs";
import { slugify } from "./material-slug.mjs";

/**
 * Where a material belongs: a university, and inside it a faculty (University of
 * Prishtina) or a study field (every other institution).
 */

const BY_SLUG = new Map(UNIVERSITIES.map((u) => [u.slug, u]));

export const isKnownUniversity = (slug) => BY_SLUG.has(slug);

export function isValidPlacement(university, faculty) {
  return isKnownUniversity(university) && facultiesFor(university).some((f) => f.code === faculty);
}

export function universityShort(slug) {
  return BY_SLUG.get(slug)?.short || "";
}

export function universityName(slug) {
  return BY_SLUG.get(slug)?.name || "";
}

/** URL part that tells universities apart in subject slugs; empty for the default one. */
export function universityTag(slug) {
  return !slug || slug === DEFAULT_UNIVERSITY ? "" : slugify(universityShort(slug) || slug);
}

export { DEFAULT_UNIVERSITY };
