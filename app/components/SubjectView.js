"use client";

import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import MaterialGrid from "./MaterialGrid";
import { DEFAULT_UNIVERSITY, universityShort } from "../lib/placement";
import { getFacultyName } from "../lib/material-options";
import { normalizeMaterial } from "../lib/material-view";
import { typeRank } from "../lib/subjects";
import { useT } from "./Preferences";

/** One subject: its materials grouped by type, exams first. */
export default function SubjectView({ subject, materials }) {
  const t = useT();
  const normalized = materials.map(normalizeMaterial);
  const byType = new Map();
  for (const m of normalized) {
    const list = byType.get(m.type) || [];
    list.push(m);
    byType.set(m.type, list);
  }
  const groups = [...byType.entries()].sort((a, b) => typeRank(a[0]) - typeRank(b[0]));
  const teachers = subject.teachers || [];

  return (
    <div className="page-shell">
      <div className="section-shell">
        <nav aria-label={t("Navigimi")} className="mb-4 flex items-center gap-1 text-sm text-gray-600">
          <Link href="/materialet" className="hover:text-burgundy-600 hover:underline">{t("Materialet")}</Link>
          <ChevronRight className="h-4 w-4" aria-hidden />
          <span aria-current="page">{subject.name}</span>
        </nav>
        <header className="mb-6 max-w-3xl">
          <h1 className="page-title mb-2 !text-3xl md:!text-4xl">{subject.name}</h1>
          <p className="text-gray-600">
            {universityShort(subject.university || DEFAULT_UNIVERSITY)} · {t(getFacultyName(subject.faculty))} · {subject.count}{" "}
            {subject.count === 1 ? t("material") : t("materiale")}
          </p>
          {teachers.length > 0 && (
            <p className="mt-2 flex items-start gap-2 text-sm text-gray-600">
              <Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{teachers.join(", ")}</span>
            </p>
          )}
        </header>

        {groups.length === 0 ? (
          <div className="surface-card max-w-xl p-8 text-center">
            <p className="text-gray-600">{t("Ende nuk ka materiale të publikuara për këtë lëndë.")}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map(([type, items]) => (
              <section key={type} aria-labelledby={`type-${typeRank(type)}-${items[0].id}`}>
                <h2
                  id={`type-${typeRank(type)}-${items[0].id}`}
                  className="mb-3 text-lg font-bold text-navy-900"
                >
                  {t(type)} <span className="font-normal text-gray-600">({items.length})</span>
                </h2>
                <MaterialGrid materials={items} showSubject={false} />
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
