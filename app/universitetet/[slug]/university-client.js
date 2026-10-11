"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useT } from "../../components/Preferences";
import { ChevronRight, ChevronDown, Search, Scale, MapPin, ExternalLink } from "lucide-react";
import {
  categoryOf,
  compareText,
  durationLabel,
  formatDate,
  getProgramme,
  getUniversity,
  levelLabel,
  levelRank,
  programmesOf,
  sectorLabel,
} from "../../lib/directory";
import { useCompare } from "../../components/CompareProvider";
import CourseList from "../../components/CourseList";

const LEVEL_TONE = {
  bachelor: "bg-teal-100 text-teal-900",
  professional: "bg-teal-100 text-teal-900",
  integrated: "bg-navy-100 text-navy-800",
  master: "bg-violet-100 text-violet-900",
  doctorate: "bg-fuchsia-100 text-fuchsia-900",
};

function ProgrammeRow({ programme, open, onToggle }) {
  const t = useT();
  const router = useRouter();
  const { first, start, clear } = useCompare();
  const firstProgramme = first ? getProgramme(first) : null;
  const isFirst = first === programme.id;
  const panelId = `prog-${programme.id.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <li className="rounded-2xl border border-gray-200 bg-surface">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left hover:bg-navy-100/40"
      >
        <span className="min-w-0">
          <span className="block font-semibold text-navy-900">{programme.name}</span>
          <span className="block truncate text-sm text-gray-600">{programme.campus}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-sm text-gray-600">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${LEVEL_TONE[programme.level] || "bg-navy-100 text-navy-800"}`}>
            {t(programme.degree)}
          </span>
          <span className="hidden sm:inline">{programme.ects} ECTS</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </span>
      </button>

      <div id={panelId} hidden={!open} className="border-t border-gray-100 px-4 py-4">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          {[
            [t("Titulli (anglisht)"), programme.nameEn],
            [t("Niveli"), t(levelLabel(programme.level))],
            [t("Kohëzgjatja"), `${durationLabel(programme.ects, t)} · ${programme.ects} ECTS`],
            [t("Kuota"), programme.quota ? t("{n} studentë", { n: programme.quota }) : "—"],
            [t("Akreditimi vlen deri më"), formatDate(programme.until, t)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold uppercase tracking-widest text-gray-600">{label}</dt>
              <dd className="mt-0.5 font-semibold text-navy-900">{value}</dd>
            </div>
          ))}
        </dl>

        {programme.note && <p className="mt-3 text-sm text-gray-600">{t(programme.note)}</p>}

        {/* Mounted only while open, so the course data loads when someone looks. */}
        {open && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <CourseList programmeId={programme.id} />
          </div>
        )}

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
              {t("Krahaso")}
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
              {t("Krahaso me {name}", { name: firstProgramme?.name })}
            </button>
          )}
          {isFirst && (
            <>
              <span className="text-sm font-semibold text-burgundy-600">{t("Zgjedhur për krahasim")}</span>
              <button type="button" onClick={clear} className="btn-outline min-h-[40px] px-4 py-2 text-sm">
                {t("Anulo")}
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

export default function UniversityClient({ slug }) {
  const t = useT();
  const university = getUniversity(slug);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [openId, setOpenId] = useState(null);

  const all = useMemo(() => programmesOf(slug), [slug]);

  // Categories with their programme counts, alphabetical, "Të tjera" last.
  const categories = useMemo(() => {
    const counts = new Map();
    for (const p of all) counts.set(categoryOf(p), (counts.get(categoryOf(p)) || 0) + 1);
    return [...counts.entries()].sort(
      (a, b) => (a[0] === "Të tjera") - (b[0] === "Të tjera") || compareText(a[0], b[0])
    );
  }, [all]);

  // Per category: Bachelor first, then professional, integrated, Master, PhD; alphabetical within a level.
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = all.filter(
      (p) =>
        (!category || categoryOf(p) === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q))
    );
    return categories
      .map(([name]) => ({
        name,
        items: list
          .filter((p) => categoryOf(p) === name)
          .sort((a, b) => levelRank(a.level) - levelRank(b.level) || compareText(a.name, b.name)),
      }))
      .filter((g) => g.items.length > 0)
      .map((g) => {
        const levels = [];
        for (const p of g.items) {
          const last = levels[levels.length - 1];
          if (last && last.key === p.level) last.items.push(p);
          else levels.push({ key: p.level, label: levelLabel(p.level), items: [p] });
        }
        return { ...g, levels };
      });
  }, [all, categories, category, query]);

  if (!university) return null;
  const name = university.name.replace(/"/g, "");

  return (
    <div className="page-shell">
      <div className="section-shell max-w-5xl">
        <nav aria-label={t("Navigimi")} className="mb-4 flex items-center gap-1 text-sm text-gray-600">
          <Link href="/universitetet" className="hover:text-burgundy-600 hover:underline">
            {t("Universitetet")}
          </Link>
          <ChevronRight className="h-4 w-4" aria-hidden />
          <span aria-current="page">{name}</span>
        </nav>

        <header className="mb-6">
          <h1 className="page-title mb-2 !text-3xl md:!text-4xl">{name}</h1>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-600">
            <span>{t(sectorLabel(university.sector))}</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" aria-hidden />
              {university.cities.join(", ")}
            </span>
            <span>{t("{n} programe të akredituara", { n: university.programmeCount })}</span>
          </p>
        </header>

        <div className="mb-6 flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Kërko program…")}
              aria-label={t("Kërko program")}
              className="input-srh min-h-[44px] w-full pl-10 text-sm"
            />
          </div>
        </div>

        {categories.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label={t("Kategoria")}>
            {[["", all.length], ...categories].map(([name, count]) => (
              <button
                key={name || "all"}
                type="button"
                aria-pressed={category === name}
                onClick={() => setCategory(name)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                  category === name
                    ? "bg-ink text-white"
                    : "bg-surface text-navy-800 ring-1 ring-gray-200 hover:ring-burgundy-600"
                }`}
              >
                {t(name || "Të gjitha")} <span className="font-normal opacity-75">{count}</span>
              </button>
            ))}
          </div>
        )}
        {groups.length === 0 ? (
          <div className="surface-card p-8 text-center text-gray-600">{t("Asnjë program nuk u gjet.")}</div>
        ) : (
          <div className="space-y-8">
            {groups.map((g, gi) => (
              <section key={g.name} aria-labelledby={`cat-${gi}`}>
                <h2 id={`cat-${gi}`} className="mb-3 text-lg font-bold text-navy-900">
                  {t(g.name)} <span className="font-normal text-gray-600">({g.items.length})</span>
                </h2>
                <div className="space-y-3">
                  {g.levels.map((lvl) => (
                    <div key={lvl.key}>
                      <h3 className="mb-1.5 text-xs font-bold uppercase tracking-widest text-gray-600">
                        {t(lvl.label)}
                      </h3>
                      <ul className="space-y-2">
                        {lvl.items.map((p) => (
                          <ProgrammeRow
                            key={p.id}
                            programme={p}
                            open={openId === p.id}
                            onToggle={() => setOpenId((id) => (id === p.id ? null : p.id))}
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <p className="mt-8 flex items-center gap-1.5 text-xs text-gray-600">
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          {t("Të dhënat vijnë nga lista e programeve të akredituara të Agjencisë së Kosovës për Akreditim.")}
        </p>
      </div>
    </div>
  );
}
