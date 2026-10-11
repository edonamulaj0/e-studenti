"use client";

import Link from "next/link";
import { Download, Eye } from "lucide-react";
import { getFacultyName } from "../lib/material-options";
import { getStudyLevelLabel } from "../lib/study-levels";
import MaterialActions from "./MaterialActions";
import MaterialMenu from "./MaterialMenu";
import { formatStatCount } from "../lib/track-material";
import { getFileTypeBadge } from "../lib/file-preview";
import { displayTeacher, normalizeMaterial, typeTone } from "../lib/material-view";
import { isRealSubject, subjectSlug } from "../lib/subjects";
import { universityShort } from "../lib/placement";
import { useT } from "./Preferences";

export { normalizeMaterial, typeTone };

export function FileBadge({ fileType, className = "" }) {
  const badge = getFileTypeBadge(fileType);
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-md px-2 py-0.5 text-[11px] font-bold tracking-tight ${badge.className} ${className}`}
    >
      {badge.label}
    </span>
  );
}

export function Stats({ material }) {
  const t = useT();
  return (
    <span className="inline-flex shrink-0 items-center gap-3 text-xs font-semibold text-gray-600">
      <span className="inline-flex items-center gap-1" title={t("Shikime")}>
        <Eye className="h-3.5 w-3.5" aria-hidden />
        <span className="sr-only">{t("Shikime")}:</span>
        {formatStatCount(Number(material.view_count || 0))}
      </span>
      <span className="inline-flex items-center gap-1" title={t("Shkarkime")}>
        <Download className="h-3.5 w-3.5" aria-hidden />
        <span className="sr-only">{t("Shkarkime")}:</span>
        {formatStatCount(Number(material.download_count || 0))}
      </span>
    </span>
  );
}

/** "Subject · Teacher" with the subject linking to all materials for it. */
export function SubjectLine({ material, showSubject = true, className = "" }) {
  const t = useT();
  const teacher = displayTeacher(material);
  const hasSubject = isRealSubject(material.subject) && showSubject;
  if (!hasSubject && teacher === "—") return null;
  return (
    <p className={`min-w-0 truncate text-sm text-navy-800 ${className}`}>
      {hasSubject && (
        <Link
          href={`/lenda/${subjectSlug(material.faculty, material.subject, material.university)}`}
          className="hover:text-burgundy-600 hover:underline"
          title={t("Të gjitha materialet për {subject}", { subject: material.subject })}
        >
          {material.subject}
        </Link>
      )}
      {hasSubject && teacher !== "—" && " · "}
      {teacher !== "—" && teacher}
    </p>
  );
}

export const placementLine = (material, t) =>
  `${universityShort(material.university)} · ${t(getFacultyName(material.faculty))}`;

/** One catalogue entry as a card. Opening the preview is the grid's job (`onView`). */
export default function MaterialCard({ material, onView, showSubject = true }) {
  const t = useT();
  return (
    <article className="surface-card flex h-full flex-col gap-2 p-4 hover:shadow-md">
      <div className="flex items-center gap-2">
        <FileBadge fileType={material.fileType} />
        <span className="min-w-0 truncate text-xs text-gray-600">
          {t(material.type)} · {t(getStudyLevelLabel(material.study_level))}
        </span>
        <span className="ml-auto">
          <MaterialMenu material={material} />
        </span>
      </div>

      <h3 className="line-clamp-2 font-display text-base font-bold leading-snug text-navy-900 hover:text-burgundy-600">
        {material.slug ? <Link href={`/materialet/${material.slug}`}>{material.title}</Link> : material.title}
      </h3>

      <SubjectLine material={material} showSubject={showSubject} />
      <p className="truncate text-xs text-gray-600">{placementLine(material, t)}</p>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
        <Stats material={material} />
        <MaterialActions material={material} onView={onView} />
      </div>
    </article>
  );
}
