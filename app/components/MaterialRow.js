"use client";

import Link from "next/link";
import { getFacultyName } from "../lib/material-options";
import { getStudyLevelLabel } from "../lib/study-levels";
import MaterialActions from "./MaterialActions";
import MaterialMenu from "./MaterialMenu";
import { FileBadge, Stats } from "./MaterialCard";
import { displayTeacher } from "../lib/material-view";
import { isRealSubject } from "../lib/subjects";
import { universityShort } from "../lib/placement";
import { useT } from "./Preferences";

/** One entry of the list view: badge, title with a one-line summary, stats and actions. */
export default function MaterialRow({ material, onView, showSubject = true }) {
  const t = useT();
  const teacher = displayTeacher(material);
  const meta = [
    t(material.type),
    t(getStudyLevelLabel(material.study_level)),
    isRealSubject(material.subject) && showSubject ? material.subject : null,
    teacher !== "—" ? teacher : null,
    `${universityShort(material.university)} · ${t(getFacultyName(material.faculty))}`,
  ].filter(Boolean);

  return (
    <li className="flex items-center gap-3 px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl hover:bg-gray-50">
      <FileBadge fileType={material.fileType} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-base font-bold text-navy-900 hover:text-burgundy-600">
          {material.slug ? <Link href={`/materialet/${material.slug}`}>{material.title}</Link> : material.title}
        </h3>
        <p className="truncate text-xs text-gray-600">{meta.join(" · ")}</p>
      </div>
      <span className="hidden sm:block">
        <Stats material={material} />
      </span>
      <MaterialActions material={material} onView={onView} />
      <MaterialMenu material={material} />
    </li>
  );
}
