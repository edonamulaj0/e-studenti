import Link from "next/link";
import ReportButton from "./ReportButton";
import MaterialViewTracker from "./MaterialViewTracker";
import MaterialViewButton from "./MaterialViewButton";
import MaterialStatsBadge from "./MaterialStatsBadge";
import MaterialDownloadButton from "./MaterialDownloadButton";
import { materialDownloadUrl } from "../lib/worker-url";
import { getFacultyName } from "../lib/material-options";
import { getStudyLevelLabel } from "../lib/study-levels";

function displayTeacher(teacher) {
  const value = String(teacher || "").trim();
  if (!value || value === "//") return "—";
  return value;
}

/**
 * Detail view of one material. Shared by the statically built page and the
 * client-side fallback for materials added since the last build, so it holds no
 * server-only code.
 */
export default function MaterialDetail({ material, slug }) {
  const facultyName = getFacultyName(material.faculty);
  const studyLevelLabel = getStudyLevelLabel(material.study_level || "bachelor");

  return (
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
              <dt className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Lënda
              </dt>
              <dd className="mt-1 font-semibold text-navy-900">{material.subject}</dd>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
              <dt className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Profesor/i
              </dt>
              <dd className="mt-1 font-semibold text-navy-900">
                {displayTeacher(material.teacher)}
              </dd>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
              <dt className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Ngarkuar nga
              </dt>
              <dd className="mt-1 font-semibold text-navy-900">
                {material.display_uploader}
              </dd>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
              <dt className="text-xs font-semibold uppercase tracking-widest text-gray-500">
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
                <MaterialViewButton
                  material={{
                    id: material.id,
                    title: material.title,
                    r2Url: material.r2_url,
                    fileType: material.file_type || material.fileType,
                    fileSize: material.file_size || material.fileSize,
                  }}
                />
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
  );
}
