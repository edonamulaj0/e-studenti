import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "../../lib/og-card";
import { fetchSubjectBySlug, fetchSubjectsForBuild } from "../../lib/fetch-materials";
import { getFacultyName } from "../../lib/material-options";

export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Lënda në E-Studenti";
export const dynamicParams = false;

export async function generateStaticParams() {
  const subjects = await fetchSubjectsForBuild();
  if (subjects.length === 0) return [{ slug: "pa-lende" }];
  return subjects.map((subject) => ({ slug: subject.slug }));
}

export default async function Image({ params }) {
  const { slug } = await params;
  const found = await fetchSubjectBySlug(slug);
  if (!found) return renderOgCard({ title: "Materiale studimore për studentët në Kosovë" });
  const { subject } = found;
  return renderOgCard({
    badge: `${subject.count} ${subject.count === 1 ? "material" : "materiale"}`,
    eyebrow: getFacultyName(subject.faculty),
    title: subject.name,
    meta: "Afate, ligjërata dhe shënime nga studentët",
  });
}
