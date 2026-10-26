"use client";

import Link from "next/link";
import { useState } from "react";
import { useT } from "../components/Preferences";
import { GraduationCap, MapPin, Building2 } from "lucide-react";
import { universities, levelCounts, sectorLabel, SOURCE } from "../lib/directory";

const FILTERS = [
  { key: "", label: "Të gjitha" },
  { key: "public", label: "Publike" },
  { key: "private", label: "Private" },
];

const SECTOR_TONE = {
  public: "bg-info-blue/10 text-info-text",
  private: "bg-burgundy-50 text-burgundy-600",
  other: "bg-navy-100 text-navy-800",
};

export default function UniversitiesClient() {
  const t = useT();
  const [filter, setFilter] = useState("");
  const shown = universities.filter((u) => !filter || u.sector === filter || (filter === "private" && u.sector === "other"));

  return (
    <div className="page-shell">
      <div className="section-shell">
        <header className="mb-6 max-w-3xl">
          <h1 className="page-title mb-2 text-3xl! leading-9! md:text-4xl! md:leading-10!">{t("Universitetet")}</h1>
          <p className="page-subtitle text-base! leading-6!">
            {t(
              "Universitetet dhe kolegjet me programe të akredituara në Kosovë. Hapni një institucion për të parë programet e tij, ose krahasoni dy programe."
            )}
          </p>
        </header>

        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label={t("Lloji i institucionit")}>
          {FILTERS.map((f) => (
            <button
              key={f.key || "all"}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                filter === f.key
                  ? "bg-ink text-white"
                  : "bg-surface text-navy-800 ring-1 ring-gray-200 hover:ring-burgundy-600"
              }`}
            >
              {t(f.label)}
            </button>
          ))}
        </div>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((u) => (
            <li key={u.slug}>
              <Link
                href={`/universitetet/${u.slug}`}
                className="surface-card group flex h-full flex-col gap-3 p-5 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-100 text-navy-800">
                    <GraduationCap className="h-5 w-5" aria-hidden />
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${SECTOR_TONE[u.sector]}`}>
                    {t(sectorLabel(u.sector))}
                  </span>
                </div>
                <h2 className="text-lg font-bold leading-snug text-navy-900 group-hover:text-burgundy-600">
                  {u.name.replace(/"/g, "")}
                </h2>
                <p className="flex items-center gap-1.5 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                  {u.cities.join(", ")}
                </p>
                {u.units.length > 0 && (
                  <p className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Building2 className="h-4 w-4 shrink-0" aria-hidden />
                    {t("{n} fakultete", { n: u.units.length })}
                  </p>
                )}
                <div className="mt-auto border-t border-gray-100 pt-3">
                  <p className="text-sm font-semibold text-navy-900">{t("{n} programe", { n: u.programmeCount })}</p>
                  <p className="mt-0.5 text-xs text-gray-600">
                    {levelCounts(u.slug)
                      .map((l) => `${t(l.label)} ${l.count}`)
                      .join(" · ")}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-xs text-gray-600">
          {t("Burimi: {source}. Një program që nuk është në këtë listë nuk është i vlefshëm në Kosovë.", {
            source: SOURCE,
          })}
        </p>
      </div>
    </div>
  );
}
