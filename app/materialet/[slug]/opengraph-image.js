import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "../../lib/og-card";
import { fetchAllMaterialsForBuild, fetchMaterialBySlug } from "../../lib/fetch-materials";
import { assignMaterialSlugs } from "../../lib/material-slug";
import { prepareMaterial } from "../../lib/material-detail";
import { getFacultyName } from "../../lib/material-options";

export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Materiali në E-Studenti";
export const dynamicParams = false;

export async function generateStaticParams() {
  const materials = await fetchAllMaterialsForBuild();
  if (materials.length === 0) return [{ slug: "pa-materiale" }];
  return assignMaterialSlugs(materials).map((material) => ({ slug: material.slug }));
}

export default async function Image({ params }) {
  const material = prepareMaterial(await fetchMaterialBySlug(params.slug), params.slug);
  if (!material) return renderOgCard({ title: "Materiale studimore për studentët në Kosovë" });
  const faculty = getFacultyName(material.faculty);
  return renderOgCard({
    badge: material.type,
    eyebrow: material.subject && material.subject !== "//" ? material.subject : faculty,
    title: material.title,
    meta: faculty,
  });
}
