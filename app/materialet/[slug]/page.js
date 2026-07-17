import Link from "next/link";
import { Eye, FileText } from "lucide-react";
import ReportButton from "../../components/ReportButton";
import MaterialViewTracker from "../../components/MaterialViewTracker";
import MaterialStatsBadge from "../../components/MaterialStatsBadge";
import MaterialDownloadButton from "../../components/MaterialDownloadButton";
import { materialDownloadUrl, materialViewUrl } from "../../lib/worker-url";
import JsonLd, {
  breadcrumbJsonLd,
  materialJsonLd,
  SITE_URL,
} from "../../components/JsonLd";
import { fetchAllMaterialsForBuild } from "../../lib/fetch-materials";
import { assignMaterialSlugs, findMaterialBySlug } from "../../lib/material-slug";
import { getFacultyName } from "../../lib/material-options";
import { getStudyLevelLabel } from "../../lib/study-levels";

export const dynamicParams = false;

async function loadMaterialBySlug(slug) {
  const materials = await fetchAllMaterialsForBuild(500);
  const match = findMaterialBySlug(materials, slug);
  if (!match) return null;
  const isAnonymous = Boolean(match.is_anonymous);
  return {
    ...match,
    slug,
    uploader_name: isAnonymous ? undefined : match.uploader_name,
    display_uploader: isAnonymous ? "Anonim" : match.uploader_name || "—",
  };
}

export async function generateStaticParams() {
  const materials = await fetchAllMaterialsForBuild(500);
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
  };
}

function displayTeacher(teacher) {
  const value = String(teacher || "").trim();
  if (!value || value === "//") return "—";
  return value;
}

export default async function MaterialDetailPage({ params }) {
  const material = await loadMaterialBySlug(params.slug);
  if (!material) {
    return (
      <div className="page-shell">
        <div className="surface-card mx-auto max-w-2xl p-10 text-center">
          <FileText className="mx-auto mb-5 h-16 w-16 text-gray-400" />
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

      <div className="page-shell">
        <MaterialViewTracker materialId={material.id} />
        <div className="section-shell max-w-4xl">
          <nav className="mb-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-burgundy-600">
              Ballina
            </Link>
            <span className="mx-2">/</span>
            <Link href="/materialet" className="hover:text-burgundy-600">
              Materialet
            </Link>
            <span className="mx-2">/</span>
            <span className="text-navy-900">{material.title}</span>
          </nav>

          <article className="surface-card p-6 md:p-10">
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-navy-100 px-3 py-1 text-sm font-semibold text-navy-800">
                {facultyName}
              </span>
              <span className="rounded-full bg-burgundy-50 px-3 py-1 text-sm font-semibold text-burgundy-600">
                {material.type}
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-navy-700 ring-1 ring-navy-100">
                {studyLevelLabel}
              </span>
            </div>

            <h1 className="page-title mb-4">{material.title}</h1>
            <p className="page-subtitle mb-4">
              {material.subject} · {facultyName}
            </p>
            <MaterialStatsBadge
              viewCount={material.view_count}
              downloadCount={material.download_count}
              className="mb-8"
            />

            <dl className="mb-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-navy-100/40 p-4">
                <dt className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Lënda
                </dt>
                <dd className="mt-1 font-semibold text-navy-900">{material.subject}</dd>
              </div>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
                <dt className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Profesor/i
                </dt>
                <dd className="mt-1 font-semibold text-navy-900">
                  {displayTeacher(material.teacher)}
                </dd>
              </div>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
                <dt className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Ngarkuar nga
                </dt>
                <dd className="mt-1 font-semibold text-navy-900">
                  {material.display_uploader}
                </dd>
              </div>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
                <dt className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Formati
                </dt>
                <dd className="mt-1 font-semibold uppercase text-navy-900">
                  {material.file_type || material.fileType || "PDF"}
                </dd>
              </div>
            </dl>

            <div className="flex flex-col gap-3 sm:flex-row">
              {material.r2_url && (
                <>
                  <a
                    href={materialViewUrl(material.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary flex-1"
                  >
                    <Eye className="h-5 w-5" />
                    Shiko materialin
                  </a>
                  <MaterialDownloadButton
                    materialId={material.id}
                    href={materialDownloadUrl(material.id)}
                    fileName={
                      material.title.replace(/[^a-z0-9]/gi, "_") +
                      "." +
                      (material.file_type || "pdf")
                    }
                  />
                </>
              )}
            </div>

            <div className="mt-6 border-t border-gray-100 pt-6">
              <ReportButton
                materialId={material.id}
                materialTitle={material.title}
                materialUrl={material.r2_url}
              />
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
