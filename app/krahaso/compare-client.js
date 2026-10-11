"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useT } from "../components/Preferences";
import {
  durationLabel,
  formatDate,
  getProgramme,
  getUniversity,
  levelLabel,
  sectorLabel,
} from "../lib/directory";

function rowsFor(p, t) {
  const u = getUniversity(p.uni);
  return {
    [t("Universiteti")]: u.name.replace(/"/g, ""),
    [t("Lloji")]: t(sectorLabel(u.sector)),
    [t("Fakulteti / fusha")]: t(p.unit || p.field),
    [t("Niveli")]: `${t(levelLabel(p.level))} (${t(p.degree)})`,
    [t("Kohëzgjatja")]: durationLabel(p.ects, t),
    [t("Kreditet")]: `${p.ects} ECTS`,
    [t("Kuota e pranimit")]: p.quota ? t("{n} studentë", { n: p.quota }) : "—",
    [t("Kampusi")]: p.campus,
    [t("Akreditimi vlen deri më")]: formatDate(p.until, t),
    [t("Titulli (anglisht)")]: p.nameEn,
  };
}

export default function CompareClient() {
  const t = useT();
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
          <p className="mb-4 text-gray-600">{t("Zgjidhni dy programe për t'i krahasuar.")}</p>
          <Link href="/universitetet" className="btn-primary">
            {t("Shiko universitetet")}
          </Link>
        </div>
      </div>
    );
  }

  const [a, b] = pair;
  const ra = rowsFor(a, t);
  const rb = rowsFor(b, t);

  return (
    <div className="page-shell">
      <div className="section-shell max-w-5xl">
        <Link
          href="/universitetet"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-burgundy-600"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("Universitetet")}
        </Link>
        <h1 className="page-title mb-6 !text-3xl md:!text-4xl">{t("Krahasimi")}</h1>

        <div className="surface-card overflow-hidden">
          <table className="w-full table-fixed text-left text-sm">
            <caption className="sr-only">{t("Krahasimi i dy programeve")}</caption>
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
        <p className="mt-3 text-xs text-gray-600">
          {t(
            "Rreshtat e theksuar janë ato ku programet ndryshojnë. Burimi: lista e programeve të akredituara të Agjencisë së Kosovës për Akreditim."
          )}
        </p>
      </div>
    </div>
  );
}
