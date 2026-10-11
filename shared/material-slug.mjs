import { FACULTY_CODES } from "./material-options.mjs";

/**
 * Material URL slugs. A slug is the title plus the faculty, and is only unique
 * relative to the whole catalogue: titles that collide get "-<id>" appended. The
 * Worker therefore computes them over every material and sends them with each
 * one; the local computation here is the same rule, used by the Worker itself
 * and as a fallback.
 */

const FACULTY_SLUGS = Object.fromEntries(FACULTY_CODES.map((code) => [code, code.toLowerCase()]));

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function facultySlug(code) {
  const normalized = String(code || "").trim().toUpperCase();
  return FACULTY_SLUGS[normalized] || slugify(normalized);
}

export function materialSlugBase(material) {
  return `${slugify(material.title)}-${facultySlug(material.faculty)}`;
}

/**
 * Adds a `slug` to every material. One already present (sent by the API) is
 * kept; otherwise it is derived from `materials`, which is only correct when
 * that is the complete list.
 */
export function assignMaterialSlugs(materials) {
  const counts = new Map();
  for (const material of materials) {
    const base = materialSlugBase(material);
    counts.set(base, (counts.get(base) || 0) + 1);
  }

  return materials.map((material) => {
    const base = materialSlugBase(material);
    const slug =
      material.slug || ((counts.get(base) || 0) > 1 ? `${base}-${material.id}` : base);
    return { ...material, slug };
  });
}

export function findMaterialBySlug(materials, slug) {
  return assignMaterialSlugs(materials).find((material) => material.slug === slug) || null;
}
