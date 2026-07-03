import fs from "node:fs";
import path from "node:path";

const SITE_URL = "https://e-studenti.com";
const WORKER_URL =
  process.env.NEXT_PUBLIC_WORKER_URL ||
  "https://r2-catalog-manager.edonaamulaj.workers.dev";

const FACULTY_SLUGS = [
  "art",
  "econ",
  "edu",
  "fa",
  "fbv",
  "fefs",
  "ffl",
  "ffz",
  "fiek",
  "fim",
  "fin",
  "fshmn",
  "law",
  "med",
];

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function facultySlug(code) {
  return FACULTY_SLUGS.includes(String(code || "").toLowerCase())
    ? String(code).toLowerCase()
    : slugify(code);
}

function materialSlugBase(material) {
  return `${slugify(material.title)}-${facultySlug(material.faculty)}`;
}

function assignSlugs(materials) {
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

function urlEntry(loc, changefreq = "weekly", priority = "0.7") {
  return `  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function fetchMaterials() {
  const res = await fetch(`${WORKER_URL}/?action=materials&page=1&limit=500`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.materials || data.entries || [];
}

async function main() {
  const staticPaths = [
    "/",
    "/materialet",
    "/burime",
    "/fakultetet",
    "/per-aplikantet",
    "/erasmus",
    "/informacione",
    "/rreth-nesh/pyetje-te-shpeshta",
    "/privatesia",
    "/kushtet",
  ];

  const materials = assignSlugs(await fetchMaterials());
  const urls = [
    ...staticPaths.map((pathName) => urlEntry(`${SITE_URL}${pathName}`, "weekly", pathName === "/" ? "1.0" : "0.8")),
    ...FACULTY_SLUGS.map((slug) =>
      urlEntry(`${SITE_URL}/fakultetet/${slug}`, "monthly", "0.7")
    ),
    ...materials.map((material) =>
      urlEntry(`${SITE_URL}/materialet/${material.slug}`, "weekly", "0.6")
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

  const outputPath = path.join(process.cwd(), "public", "sitemap.xml");
  fs.writeFileSync(outputPath, xml, "utf8");
  console.log(`Wrote ${urls.length} URLs to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
