import Link from "next/link";
import { BookOpen } from "lucide-react";
import SubjectView from "../../components/SubjectView";
import JsonLd, { breadcrumbJsonLd, SITE_URL } from "../../components/JsonLd";
import { fetchSubjectBySlug, fetchSubjectsForBuild } from "../../lib/fetch-materials";
import { getFacultyName } from "../../lib/material-options";

// Only subjects that existed at build time get a static page. Others fall through
// to the 404 page, which loads them client-side (see app/not-found.js).
export const dynamicParams = false;

export async function generateStaticParams() {
  const subjects = await fetchSubjectsForBuild();
  if (subjects.length === 0) return [{ slug: "pa-lende" }];
  return subjects.map((subject) => ({ slug: subject.slug }));
}

export async function generateMetadata({ params }) {
  const found = await fetchSubjectBySlug(params.slug);
  if (!found) return { title: "Lënda nuk u gjet" };
  const { subject } = found;
  const faculty = getFacultyName(subject.faculty);
  const title = `${subject.name} — ${faculty}`;
  const description = `${subject.count} materiale për lëndën ${subject.name} (${faculty}): afate, ligjerata dhe më shumë në E-Studenti.`;
  return {
    title,
    description: description.slice(0, 160),
    alternates: { canonical: `${SITE_URL}/lenda/${params.slug}` },
  };
}

export default async function SubjectPage({ params }) {
  const found = await fetchSubjectBySlug(params.slug);
  if (!found) {
    return (
      <div className="page-shell">
        <div className="surface-card mx-auto max-w-2xl p-10 text-center">
          <BookOpen className="mx-auto mb-5 h-16 w-16 text-gray-500" />
          <h1 className="mb-4 font-display text-3xl font-bold text-navy-900">Lënda nuk u gjet</h1>
          <Link href="/materialet" className="btn-primary">Kthehu te materialet</Link>
        </div>
      </div>
    );
  }
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Ballina", url: SITE_URL },
          { name: "Materialet", url: `${SITE_URL}/materialet` },
          { name: found.subject.name, url: `${SITE_URL}/lenda/${params.slug}` },
        ])}
      />
      <SubjectView subject={found.subject} materials={found.materials} />
    </>
  );
}
