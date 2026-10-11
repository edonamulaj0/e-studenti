import Link from "next/link";
import { FileText } from "lucide-react";
import MaterialDetail from "../../components/MaterialDetail";
import JsonLd, {
  breadcrumbJsonLd,
  materialJsonLd,
  SITE_URL,
} from "../../components/JsonLd";
import { fetchAllMaterialsForBuild, fetchMaterialBySlug } from "../../lib/fetch-materials";
import { assignMaterialSlugs } from "../../lib/material-slug";
import { prepareMaterial } from "../../lib/material-detail";
import { getFacultyName } from "../../lib/material-options";
import { getStudyLevelLabel } from "../../lib/study-levels";

// Only materials that existed at build time get a static page. Any other
// /materialet/<slug> falls through to the 404 page, which loads it client-side
// (see app/not-found.js), so uploads show up without a redeploy.
export const dynamicParams = false;

async function loadMaterialBySlug(slug) {
  // The Worker resolves the slug against the full catalogue; resolving it here
  // against a build-time batch missed everything outside that batch.
  return prepareMaterial(await fetchMaterialBySlug(slug), slug);
}

export async function generateStaticParams() {
  const materials = await fetchAllMaterialsForBuild();
  return assignMaterialSlugs(materials).map((material) => ({
    slug: material.slug,
  }));
}

export async function generateMetadata({ params }) {
  const material = await loadMaterialBySlug(params.slug);
  if (!material) {
    return { title: "Materiali nuk u gjet" };
  }
  const facultyName = getFacultyName(material.faculty);
  const title = `${material.title} — ${material.subject || facultyName}`;
  const description = `${material.type} për ${material.subject || facultyName} (${facultyName}). Shkarkoni ose shikoni materialin studimor në E-Studenti.`;
  return {
    title,
    description: description.slice(0, 160),
    alternates: {
      canonical: `${SITE_URL}/materialet/${params.slug}`,
    },
    openGraph: {
      type: "article",
      locale: "sq_AL",
      url: `${SITE_URL}/materialet/${params.slug}`,
      siteName: "E-Studenti",
      title,
      description: description.slice(0, 160),
    },
  };
}

export default async function MaterialDetailPage({ params }) {
  const material = await loadMaterialBySlug(params.slug);
  if (!material) {
    return (
      <div className="page-shell">
        <div className="surface-card mx-auto max-w-2xl p-10 text-center">
          <FileText className="mx-auto mb-5 h-16 w-16 text-gray-500" />
          <h1 className="mb-4 font-display text-3xl font-bold text-navy-900">
            Materiali nuk u gjet
          </h1>
          <Link href="/materialet" className="btn-primary">
            Kthehu te materialet
          </Link>
        </div>
      </div>
    );
  }

  const facultyName = getFacultyName(material.faculty);
  const studyLevelLabel = getStudyLevelLabel(material.study_level || "bachelor");
  const detailUrl = `${SITE_URL}/materialet/${params.slug}`;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Ballina", url: SITE_URL },
          { name: "Materialet", url: `${SITE_URL}/materialet` },
          { name: material.title, url: detailUrl },
        ])}
      />
      <JsonLd
        data={materialJsonLd({ ...material, slug: params.slug }, {
          facultyName,
          studyLevelLabel,
        })}
      />
      <MaterialDetail material={material} slug={params.slug} />
    </>
  );
}
