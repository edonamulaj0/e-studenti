import fs from "node:fs";
import path from "node:path";
import { assignMaterialSlugs } from "../shared/material-slug.mjs";
import { FACULTY_CODES } from "../shared/material-options.mjs";

const SITE_URL = "https://e-studenti.com";
const WORKER_URL =
  process.env.NEXT_PUBLIC_WORKER_URL ||
  "https://api.e-studenti.com";

const { universities } = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "app/data/universities.json"), "utf8")
);

const FACULTY_SLUGS = FACULTY_CODES.map((code) => code.toLowerCase());

function urlEntry(loc, changefreq = "weekly", priority = "0.7") {
  return `  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function fetchMaterials() {
  // The Worker caps `limit` at 100, so page through the whole catalogue. Any
  // failure aborts the build: a sitemap built from a partial list would quietly
  // drop pages from search results.
  const all = [];
  for (let page = 1; page <= 200; page += 1) {
    const res = await fetch(`${WORKER_URL}/?action=materials&page=${page}&limit=100`);
    if (!res.ok) {
      throw new Error(`${WORKER_URL} answered ${res.status} while listing materials`);
    }
    const data = await res.json();
    all.push(...(data.materials || data.entries || []));
    if (!data.pagination?.hasNextPage) break;
  }
  return all;
}

async function fetchSubjects() {
  const res = await fetch(`${WORKER_URL}/?action=subjects`);
  if (!res.ok) throw new Error(`${WORKER_URL} answered ${res.status} while listing subjects`);
  return (await res.json()).subjects || [];
}

async function main() {
  const staticPaths = [
    "/",
    "/materialet",
    "/burime",
    "/fakultetet",
    "/universitetet",
    "/erasmus",
    "/informacione",
    "/statistikat",
    "/rreth-nesh/pyetje-te-shpeshta",
    "/privatesia",
    "/kushtet",
  ];

  const materials = assignMaterialSlugs(await fetchMaterials());
  const subjects = await fetchSubjects();
  const urls = [
    ...staticPaths.map((pathName) => urlEntry(`${SITE_URL}${pathName}`, "weekly", pathName === "/" ? "1.0" : "0.8")),
    ...universities.map((u) => urlEntry(`${SITE_URL}/universitetet/${u.slug}`, "monthly", "0.7")),
    ...FACULTY_SLUGS.map((slug) =>
      urlEntry(`${SITE_URL}/fakultetet/${slug}`, "monthly", "0.7")
    ),
    ...subjects.map((subject) => urlEntry(`${SITE_URL}/lenda/${subject.slug}`, "weekly", "0.7")),
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
  console.error(`generate-sitemap failed: ${error.message}`);
  console.error(
    "Is the API reachable? Set NEXT_PUBLIC_WORKER_URL, or run `npm run stub-api` for an offline build."
  );
  process.exit(1);
});
