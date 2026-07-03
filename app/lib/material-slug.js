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
  const titlePart = slugify(material.title);
  const facultyPart = facultySlug(material.faculty);
  return `${titlePart}-${facultyPart}`;
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
  const withSlugs = assignMaterialSlugs(materials);
  return withSlugs.find((material) => material.slug === slug) || null;
}

export function materialDetailPath(material) {
  const base = materialSlugBase(material);
  return `/materialet/${base}${material.slug && material.slug !== base ? `-${material.id}` : ""}`;
}

export function materialDetailPathFromList(material, allMaterials) {
  const withSlugs = assignMaterialSlugs(allMaterials);
  const match = withSlugs.find((entry) => entry.id === material.id);
  return match ? `/materialet/${match.slug}` : materialDetailPath(material);
}
