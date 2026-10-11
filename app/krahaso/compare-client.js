"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import CourseList, { loadCourses } from "../components/CourseList";
import {
  durationLabel,
  formatDate,
  getProgramme,
  getUniversity,
  levelLabel,
  sectorLabel,
} from "../lib/directory";

function rowsFor(p) {
  const u = getUniversity(p.uni);
  return {
    Universiteti: u.name.replace(/"/g, ""),
    Lloji: sectorLabel(u.sector),
    "Fakulteti / fusha": p.unit || p.field,
    Niveli: `${levelLabel(p.level)} (${p.degree})`,
    Kohëzgjatja: durationLabel(p.ects),
    Kreditet: `${p.ects} ECTS`,
    "Kuota e pranimit": p.quota ? `${p.quota} studentë` : "—",
    Kampusi: p.campus,
    "Akreditimi vlen deri më": formatDate(p.until),
    "Titulli (anglisht)": p.nameEn,
  };
}

const fold = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Lists of both programmes, plus how many course names they have in common. */
function CoursesCompare({ a, b }) {
  const [all, setAll] = useState(null);
  useEffect(() => {
    loadCourses().then(setAll);
  }, []);
  if (!all) return null;
  const ea = all[a.id];
  const eb = all[b.id];
  const shared = ea && eb ? (() => {
    const names = new Set(eb.courses.map((c) => fold(c[2])));
    return ea.courses.filter((c) => names.has(fold(c[2]))).length;
  })() : null;

  return (
    <section aria-labelledby="courses-compare" className="mt-8">
      <h2 id="courses-compare" className="mb-1 text-xl font-bold text-navy-900">Lëndët</h2>
      {shared > 0 && (
        <p className="mb-4 text-sm text-gray-600">
          {shared} lëndë kanë të njëjtin emër në të dy programet.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {[a, b].map((p) => (
          <div key={p.id} className="surface-card p-4">
            <h3 className="mb-3 font-bold text-navy-900">{p.name}</h3>
            <CourseList programmeId={p.id} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function CompareClient() {
  const [pair, setPair] = useState(undefined);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const a = getProgramme(params.get("a") || "");
    const b = getProgramme(params.get("b") || "");
    setPair(a && b ? [a, b] : null);
  }, []);

  if (pair === undefined) return <div className="page-shell" aria-busy="true" />;
  if (pair === null) {
    return (
      <div className="page-shell">
        <div className="surface-card mx-auto max-w-xl p-8 text-center">
          <p className="mb-4 text-gray-600">Zgjidhni dy programe për t&apos;i krahasuar.</p>
          <Link href="/universitetet" className="btn-primary">
            Shiko universitetet
          </Link>
        </div>
      </div>
    );
  }

  const [a, b] = pair;
  const ra = rowsFor(a);
  const rb = rowsFor(b);

  return (
    <div className="page-shell">
      <div className="section-shell max-w-5xl">
        <Link
          href="/universitetet"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-burgundy-600"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Universitetet
        </Link>
        <h1 className="page-title mb-6 !text-3xl md:!text-4xl">Krahasimi</h1>

        <div className="surface-card overflow-hidden">
          <table className="w-full table-fixed text-left text-sm">
            <caption className="sr-only">Krahasimi i dy programeve</caption>
            <thead>
              <tr className="border-b border-gray-200 bg-navy-100/40 align-top">
                <th scope="col" className="w-28 p-3 sm:w-48" />
                {[a, b].map((p) => (
                  <th key={p.id} scope="col" className="p-3 text-base font-bold text-navy-900">
                    <Link href={`/universitetet/${p.uni}`} className="hover:text-burgundy-600">
                      {p.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(ra).map((label) => {
                const differs = ra[label] !== rb[label];
                return (
                  <tr key={label} className="border-b border-gray-100 last:border-0">
                    <th scope="row" className="p-3 align-top text-xs font-semibold uppercase tracking-wider text-gray-600">
                      {label}
                    </th>
                    {[ra[label], rb[label]].map((value, i) => (
                      <td
                        key={i}
                        className={`p-3 align-top font-semibold ${
                          differs ? "bg-warning-amber/10 text-navy-900" : "text-gray-600"
                        }`}
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <CoursesCompare a={a} b={b} />
        <p className="mt-3 text-xs text-gray-600">
          Rreshtat e theksuar janë ato ku programet ndryshojnë. Burimi: lista e programeve të akredituara të
          Agjencisë së Kosovës për Akreditim.
        </p>
      </div>
    </div>
  );
}
