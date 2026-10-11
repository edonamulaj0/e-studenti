"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronRight, ChevronDown, Search, Scale, MapPin, ExternalLink } from "lucide-react";
import {
  LEVELS,
  durationLabel,
  formatDate,
  getProgramme,
  getUniversity,
  programmesOf,
  sectorLabel,
} from "../../lib/directory";
import { useCompare } from "../../components/CompareProvider";

function ProgrammeRow({ programme, open, onToggle }) {
  const router = useRouter();
  const { first, start, clear } = useCompare();
  const firstProgramme = first ? getProgramme(first) : null;
  const isFirst = first === programme.id;
  const panelId = `prog-${programme.id.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <li className="rounded-2xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left hover:bg-navy-100/40"
      >
        <span className="min-w-0">
          <span className="block font-semibold text-navy-900">{programme.name}</span>
          <span className="block truncate text-sm text-gray-600">
            {[programme.unit, programme.campus].filter(Boolean).join(" · ")}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-sm text-gray-600">
          <span className="hidden sm:inline">{programme.ects} ECTS</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </span>
      </button>

      <div id={panelId} hidden={!open} className="border-t border-gray-100 px-4 py-4">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          {[
            ["Titulli (anglisht)", programme.nameEn],
            ["Kohëzgjatja", `${durationLabel(programme.ects)} · ${programme.ects} ECTS`],
            ["Kuota", programme.quota ? `${programme.quota} studentë` : "—"],
            ["Akreditimi vlen deri më", formatDate(programme.until)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold uppercase tracking-widest text-gray-600">{label}</dt>
              <dd className="mt-0.5 font-semibold text-navy-900">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!first && (
            <button
              type="button"
              onClick={() => {
                start(programme.id);
                router.push("/universitetet");
              }}
              className="btn-primary min-h-[40px] px-4 py-2 text-sm"
            >
              <Scale className="h-4 w-4" aria-hidden />
              Krahaso
            </button>
          )}
          {first && !isFirst && (
            <button
              type="button"
              onClick={() => {
                clear();
                router.push(`/krahaso?a=${encodeURIComponent(first)}&b=${encodeURIComponent(programme.id)}`);
              }}
              className="btn-primary min-h-[40px] px-4 py-2 text-sm"
            >
              <Scale className="h-4 w-4" aria-hidden />
              Krahaso me {firstProgramme?.name}
            </button>
          )}
          {isFirst && (
            <>
              <span className="text-sm font-semibold text-burgundy-600">Zgjedhur për krahasim</span>
              <button type="button" onClick={clear} className="btn-outline min-h-[40px] px-4 py-2 text-sm">
                Anulo
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

export default function UniversityClient({ slug }) {
  const university = getUniversity(slug);
  const [query, setQuery] = useState("");
  const [unit, setUnit] = useState("");
  const [openId, setOpenId] = useState(null);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = programmesOf(slug).filter(
      (p) =>
        (!unit || p.unit === unit) &&
        (!q || p.name.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q))
    );
    return LEVELS.map((level) => ({
      ...level,
      items: list
        .filter((p) => p.level === level.key)
        .sort((a, b) => a.name.localeCompare(b.name, "sq")),
    })).filter((g) => g.items.length > 0);
  }, [slug, query, unit]);

  if (!university) return null;
  const name = university.name.replace(/"/g, "");

  return (
    <div className="page-shell">
      <div className="section-shell max-w-5xl">
        <nav aria-label="Navigimi" className="mb-4 flex items-center gap-1 text-sm text-gray-600">
          <Link href="/universitetet" className="hover:text-burgundy-600 hover:underline">
            Universitetet
          </Link>
          <ChevronRight className="h-4 w-4" aria-hidden />
          <span aria-current="page">{name}</span>
        </nav>

        <header className="mb-6">
          <h1 className="page-title mb-2 !text-3xl md:!text-4xl">{name}</h1>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-600">
            <span>{sectorLabel(university.sector)}</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" aria-hidden />
              {university.cities.join(", ")}
            </span>
            <span>{university.programmeCount} programe të akredituara</span>
          </p>
        </header>

        <div className="mb-6 flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Kërko program…"
              aria-label="Kërko program"
              className="input-srh min-h-[44px] w-full pl-10 text-sm"
            />
          </div>
          {university.units.length > 0 && (
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              aria-label="Fakulteti"
              className="input-srh min-h-[44px] text-sm sm:w-72"
            >
              <option value="">Të gjitha fakultetet</option>
              {university.units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          )}
        </div>

        {groups.length === 0 ? (
          <div className="surface-card p-8 text-center text-gray-600">Asnjë program nuk u gjet.</div>
        ) : (
          <div className="space-y-8">
            {groups.map((g) => (
              <section key={g.key} aria-labelledby={`lvl-${g.key}`}>
                <h2 id={`lvl-${g.key}`} className="mb-3 text-lg font-bold text-navy-900">
                  {g.label} <span className="font-normal text-gray-600">({g.items.length})</span>
                </h2>
                <ul className="space-y-2">
                  {g.items.map((p) => (
                    <ProgrammeRow
                      key={p.id}
                      programme={p}
                      open={openId === p.id}
                      onToggle={() => setOpenId((id) => (id === p.id ? null : p.id))}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        <p className="mt-8 flex items-center gap-1.5 text-xs text-gray-600">
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          Të dhënat vijnë nga lista e programeve të akredituara të Agjencisë së Kosovës për Akreditim.
        </p>
      </div>
    </div>
  );
}
