"use client";

import Link from "next/link";
import { Download, Eye, Archive, BadgeCheck, Tag } from "lucide-react";
import { getFacultyName } from "../lib/material-options";
import { getStudyLevelLabel } from "../lib/study-levels";
import ReportButton from "./ReportButton";
import TrackableDownloadLink from "./TrackableDownloadLink";
import { formatStatCount } from "../lib/track-material";
import { materialDownloadUrl, materialViewUrl } from "../lib/worker-url";
import { getFileTypeBadge, hasInBrowserView } from "../lib/file-preview";
import { displayTeacher, levelTone, normalizeMaterial, typeTone } from "../lib/material-view";
import { isRealSubject, subjectSlug } from "../lib/subjects";
import { universityShort } from "../lib/placement";
import { useT } from "./Preferences";

export { normalizeMaterial, typeTone };

/**
 * One catalogue entry: file badge and two-line title, type and level chips,
 * subject tag and teacher, faculty, then stats and uploader, and a last row that
 * holds only the buttons. Opening the
 * preview is the grid's job (`onView`), so a page of cards shares one modal.
 */
export default function MaterialCard({ material, onView, showSubject = true }) {
  const t = useT();
  const tone = typeTone(material.type);
  const isArchive = material.fileType?.toLowerCase() === "zip";
  const fileBadge = getFileTypeBadge(material.fileType);
  const teacher = displayTeacher(material);
  const hasSubject = isRealSubject(material.subject) && showSubject;
  const views = Number(material.view_count || 0);
  const downloads = Number(material.download_count || 0);
  const canView = Boolean(material.r2Url) && hasInBrowserView(material.fileType);

  return (
    <article
      className={`surface-card group flex h-full flex-col gap-2 p-3.5 hover:shadow-md ${tone.card}`}
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
          <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
            <span className={`rounded-full px-2.5 py-1 font-semibold ${tone.chip}`}>{t(material.type)}</span>
            <span className={`rounded-full px-2.5 py-1 font-semibold ${levelTone(material.study_level)}`}>
              {t(getStudyLevelLabel(material.study_level))}
            </span>
          </p>
        </div>
      </div>

      <div className="min-w-0 space-y-1 text-sm text-gray-600">
        {(hasSubject || teacher !== "—") && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {hasSubject && (
              <Link
                href={`/lenda/${subjectSlug(material.faculty, material.subject, material.university)}`}
                className="inline-flex max-w-full items-center gap-1 rounded-full bg-burgundy-50 px-2.5 py-0.5 text-xs font-semibold text-burgundy-600 hover:bg-burgundy-600 hover:text-white"
                title={t("Të gjitha materialet për {subject}", { subject: material.subject })}
              >
                <Tag className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{material.subject}</span>
              </Link>
            )}
            {teacher !== "—" && <span className="min-w-0 truncate">{teacher}</span>}
          </p>
        )}
        <p className="truncate text-xs text-gray-600">
          <span className="font-semibold">{universityShort(material.university)}</span> · {t(getFacultyName(material.faculty))}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-2 text-xs text-gray-600">
        <span className="inline-flex shrink-0 items-center gap-3 font-semibold">
          <span className="inline-flex items-center gap-1" title={t("Shikime")}>
            <Eye className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">{t("Shikime:")}</span>
            {formatStatCount(views)}
          </span>
          <span className="inline-flex items-center gap-1" title={t("Shkarkime")}>
            <Download className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">{t("Shkarkime:")}</span>
            {formatStatCount(downloads)}
          </span>
        </span>
        {material.submittedBy?.name && (
          <span className="inline-flex min-w-0 items-center gap-1 text-gray-600">
            {material.uploader_trusted && (
              <BadgeCheck
                className="h-3.5 w-3.5 shrink-0 text-info-text"
                aria-label={t("Kontribues i besuar")}
                role="img"
              />
            )}
            <span className="truncate">{t(material.submittedBy.name)}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {canView &&
          (isArchive ? (
            <button
              type="button"
              onClick={() => onView?.(material)}
              className="btn-outline min-h-[40px] flex-1 px-3 py-1.5 text-sm"
            >
              <Archive className="h-4 w-4" aria-hidden />
              {t("Përmbajtja")}
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
              className="btn-primary min-h-[40px] flex-1 px-3 py-1.5 text-sm"
            >
              <Eye className="h-4 w-4" aria-hidden />
              {t("Shiko")}
            </a>
          ))}
        {material.r2Url && (
          <TrackableDownloadLink
            materialId={material.id}
            href={materialDownloadUrl(material.id)}
            target="_blank"
            rel="noopener noreferrer"
            download={material.title.replace(/[^a-z0-9]/gi, "_") + "." + (material.fileType || "pdf")}
            className="btn-secondary min-h-[40px] flex-1 px-3 py-1.5 text-sm"
          >
            <Download className="h-4 w-4" aria-hidden />
            {t("Shkarko")}
          </TrackableDownloadLink>
        )}
        <ReportButton
          compact
          materialId={material.id}
          materialTitle={material.title}
          materialUrl={material.r2Url}
        />
      </div>
    </article>
  );
}
