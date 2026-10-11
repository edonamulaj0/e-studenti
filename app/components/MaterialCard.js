"use client";

import Link from "next/link";
import { Download, Eye, Archive, BadgeCheck } from "lucide-react";
import { getFacultyName } from "../lib/material-options";
import { getStudyLevelLabel } from "../lib/study-levels";
import ReportButton from "./ReportButton";
import TrackableDownloadLink from "./TrackableDownloadLink";
import { formatStatCount } from "../lib/track-material";
import { materialDownloadUrl, materialViewUrl } from "../lib/worker-url";
import { getFileTypeBadge, hasInBrowserView } from "../lib/file-preview";
import { displayTeacher, normalizeMaterial, typeTone } from "../lib/material-view";
import { isRealSubject, subjectSlug } from "../lib/subjects";

export { normalizeMaterial, typeTone };

/**
 * One catalogue entry, kept to roughly 150px: badge + two-line title, one line
 * of facts, one line for subject and teacher, one footer row. Opening the
 * preview is the grid's job (`onView`), so a page of cards shares one modal.
 */
export default function MaterialCard({ material, onView, showSubject = true }) {
  const tone = typeTone(material.type);
  const isArchive = material.fileType?.toLowerCase() === "zip";
  const fileBadge = getFileTypeBadge(material.fileType);
  const teacher = displayTeacher(material);
  const hasSubject = isRealSubject(material.subject);
  const views = Number(material.view_count || 0);
  const downloads = Number(material.download_count || 0);
  const canView = Boolean(material.r2Url) && hasInBrowserView(material.fileType);

  return (
    <article
      className={`surface-card group flex h-full flex-col gap-2.5 p-3.5 hover:shadow-md ${tone.card}`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold tracking-tight ${fileBadge.className}`}
        >
          {fileBadge.label}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-navy-900 group-hover:text-burgundy-600">
            {material.slug ? (
              <Link href={`/materialet/${material.slug}`}>{material.title}</Link>
            ) : (
              material.title
            )}
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-gray-600">
            <abbr
              title={getFacultyName(material.faculty)}
              className="rounded-md bg-navy-100 px-1.5 py-0.5 font-semibold text-navy-800 no-underline"
            >
              {material.faculty}
            </abbr>
            <span className={`rounded-md px-1.5 py-0.5 font-semibold ${tone.chip}`}>
              {material.type}
            </span>
            <span>{getStudyLevelLabel(material.study_level)}</span>
          </p>
        </div>
      </div>

      {(hasSubject || teacher !== "—") && (
        <p className="truncate text-sm text-gray-600">
          {hasSubject &&
            (showSubject ? (
              <Link
                href={`/lenda/${subjectSlug(material.faculty, material.subject)}`}
                className="font-semibold text-navy-900 hover:text-burgundy-600 hover:underline"
              >
                {material.subject}
              </Link>
            ) : (
              <span className="font-semibold text-navy-900">{material.subject}</span>
            ))}
          {hasSubject && teacher !== "—" && " · "}
          {teacher !== "—" && teacher}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-xs text-gray-600">
          {(views > 0 || downloads > 0) && (
            <span className="inline-flex shrink-0 items-center gap-2 font-semibold">
              {views > 0 && (
                <span className="inline-flex items-center gap-1" title="Shikime">
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                  <span className="sr-only">Shikime:</span>
                  {formatStatCount(views)}
                </span>
              )}
              {downloads > 0 && (
                <span className="inline-flex items-center gap-1" title="Shkarkime">
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  <span className="sr-only">Shkarkime:</span>
                  {formatStatCount(downloads)}
                </span>
              )}
            </span>
          )}
          {material.submittedBy?.name && (
            <span className="inline-flex min-w-0 items-center gap-1 text-gray-500">
              {material.uploader_trusted && (
                <BadgeCheck
                  className="h-3.5 w-3.5 shrink-0 text-info-text"
                  aria-label="Kontribues i besuar"
                  role="img"
                />
              )}
              <span className="truncate">{material.submittedBy.name}</span>
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {canView &&
            (isArchive ? (
              <button
                type="button"
                onClick={() => onView?.(material)}
                className="btn-outline min-h-[36px] px-3 py-1.5 text-sm"
              >
                <Archive className="h-4 w-4" aria-hidden />
                Përmbajtja
              </button>
            ) : (
              <a
                href={materialViewUrl(material.id)}
                onClick={(e) => {
                  e.preventDefault();
                  onView?.(material);
                }}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary min-h-[36px] px-3 py-1.5 text-sm"
              >
                <Eye className="h-4 w-4" aria-hidden />
                Shiko
              </a>
            ))}
          {material.r2Url && (
            <TrackableDownloadLink
              materialId={material.id}
              href={materialDownloadUrl(material.id)}
              target="_blank"
              rel="noopener noreferrer"
              download={
                material.title.replace(/[^a-z0-9]/gi, "_") + "." + (material.fileType || "pdf")
              }
              aria-label={`Shkarko: ${material.title}`}
              title="Shkarko"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-navy-800 transition-colors hover:border-burgundy-600 hover:text-burgundy-600"
            >
              <Download className="h-4 w-4" aria-hidden />
            </TrackableDownloadLink>
          )}
          <ReportButton
            compact
            materialId={material.id}
            materialTitle={material.title}
            materialUrl={material.r2Url}
          />
        </div>
      </div>
    </article>
  );
}
