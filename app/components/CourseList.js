"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { useT } from "./Preferences";

/** Course data is large and only needed when someone opens a programme, so it loads on demand. */
let coursesPromise;
export function loadCourses() {
  coursesPromise ||= import("../data/courses.json").then((m) => m.default || m);
  return coursesPromise;
}

export function useCourses(programmeId) {
  const [state, setState] = useState({ loading: true, entry: null });
  useEffect(() => {
    let cancelled = false;
    loadCourses().then((all) => {
      if (!cancelled) setState({ loading: false, entry: all[programmeId] || null });
    });
    return () => {
      cancelled = true;
    };
  }, [programmeId]);
  return state;
}

/** Courses grouped by year and semester, in the order the source lists them. */
export function groupCourses(courses) {
  const groups = [];
  for (const [year, semester, name, ects, type] of courses) {
    const key = `${year ?? ""}|${semester ?? ""}`;
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = {
        key,
        year: semester ? Math.ceil(semester / 2) : year,
        semester,
        label: semester ? `Viti ${Math.ceil(semester / 2)} · Semestri ${semester}` : year ? `Viti ${year}` : "Lëndët",
        items: [],
      };
      groups.push(group);
    }
    group.items.push({ name, ects, type });
  }
  return groups;
}

const isElective = (type) => /^(E|Z|elective|optional)/i.test(type || "");

export default function CourseList({ programmeId }) {
  const t = useT();
  const { loading, entry } = useCourses(programmeId);

  if (loading) return <p className="text-sm text-gray-600">{t("Duke ngarkuar lëndët…")}</p>;
  if (!entry) {
    return <p className="text-sm text-gray-600">{t("Lista e lëndëve nuk është e disponueshme ende për këtë program.")}</p>;
  }

  const groups = groupCourses(entry.courses);
  const labelOf = (g) =>
    g.semester
      ? t("Viti {y} · Semestri {s}", { y: g.year, s: g.semester })
      : g.year
        ? t("Viti {y}", { y: g.year })
        : t("Lëndët");
  return (
    <div>
      <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-600">
        {t("Lëndët")} ({entry.courses.length})
      </h4>
      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((g) => (
          <section key={g.key} aria-label={labelOf(g)}>
            <h5 className="mb-1 text-sm font-bold text-navy-900">{labelOf(g)}</h5>
            <ul className="space-y-0.5 text-sm">
              {g.items.map((c, i) => (
                <li key={i} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 text-navy-900">
                    {c.name.replace(/\s*§\s*/g, " · ").replace(/^ · /, "")}
                    {isElective(c.type) && <span className="ml-1.5 text-xs text-gray-600">{t("(zgjedhore)")}</span>}
                  </span>
                  {c.ects != null && <span className="shrink-0 text-xs text-gray-600">{c.ects} ECTS</span>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
        {entry.namesOnly && <span>{t("Burimi jep vetëm emrat e lëndëve, pa kredite.")}</span>}
        {entry.source && (
          <a
            href={entry.source}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-burgundy-600 hover:underline"
          >
            <ExternalLink className="h-3 w-3" aria-hidden />
            {t("Burimi")}
          </a>
        )}
      </p>
    </div>
  );
}
