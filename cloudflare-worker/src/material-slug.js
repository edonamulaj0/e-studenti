const FACULTY_SLUGS = {
  ART: "art",
  ECON: "econ",
  EDU: "edu",
  FA: "fa",
  FBV: "fbv",
  FEFS: "fefs",
  FFL: "ffl",
  FFZ: "ffz",
  FIEK: "fiek",
  FIM: "fim",
  FIN: "fin",
  FSHMN: "fshmn",
  LAW: "law",
  MED: "med",
};

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

export function assignMaterialSlugs(materials) {
  const counts = new Map();
  for (const material of materials) {
    const base = materialSlugBase(material);
    counts.set(base, (counts.get(base) || 0) + 1);
  }

  return materials.map((material) => {
    const base = materialSlugBase(material);
    const slug =
      (counts.get(base) || 0) > 1 ? `${base}-${material.id}` : base;
    return { ...material, slug };
  });
}

export function findMaterialBySlug(materials, slug) {
  return assignMaterialSlugs(materials).find((material) => material.slug === slug) || null;
}
