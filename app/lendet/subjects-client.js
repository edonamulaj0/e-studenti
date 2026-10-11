"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight } from "lucide-react";
import { FACULTIES, getFacultyName } from "../lib/material-options";

const MAX_SUGGESTIONS = 8;

export default function SubjectsClient({ subjects }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [faculty, setFaculty] = useState("");
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const listRef = useRef(null);

  const sorted = useMemo(
    () => [...subjects].sort((a, b) => a.name.localeCompare(b.name, "sq")),
    [subjects]
  );

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const starts = [];
    const contains = [];
    for (const s of sorted) {
      const name = s.name.toLowerCase();
      if (name.startsWith(q)) starts.push(s);
      else if (name.includes(q)) contains.push(s);
    }
    return [...starts, ...contains].slice(0, MAX_SUGGESTIONS);
  }, [sorted, query]);

  const browse = useMemo(() => {
    const visible = sorted.filter((s) => !faculty || s.faculty === faculty);
    const byLetter = new Map();
    for (const s of visible) {
      const letter = s.name.charAt(0).toLocaleUpperCase("sq");
      byLetter.set(letter, [...(byLetter.get(letter) || []), s]);
    }
    return [...byLetter.entries()];
  }, [sorted, faculty]);

  const go = (s) => router.push(`/lenda/${s.slug}`);

  const onKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      go(suggestions[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && query.trim() && suggestions.length > 0;

  return (
    <div className="page-shell">
      <div className="section-shell max-w-4xl">
        <header className="mb-6">
          <h1 className="page-title mb-2 !text-3xl md:!text-4xl">Lëndët</h1>
          <p className="page-subtitle !text-base">
            Gjeni një lëndë dhe shihni gjithçka në një vend: afatet, ligjeratat dhe projektet.
          </p>
        </header>

        <div className="relative mb-8">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" aria-hidden />
          <input
            type="text"
            role="combobox"
            aria-expanded={Boolean(showList)}
            aria-controls="subject-suggestions"
            aria-activedescendant={active >= 0 ? `subject-opt-${active}` : undefined}
            aria-autocomplete="list"
            aria-label="Kërko lëndë"
            placeholder="Shkruani emrin e lëndës…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(-1); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={onKeyDown}
            className="input-srh min-h-[52px] w-full pl-12 text-base"
          />
          {query.trim() && open && suggestions.length === 0 && (
            <p className="absolute z-20 mt-2 w-full rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-lg">
              Nuk u gjet asnjë lëndë për “{query.trim()}”.
            </p>
          )}
          {showList && (
            <ul
              id="subject-suggestions"
              ref={listRef}
              role="listbox"
              className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white py-1 shadow-lg"
            >
              {suggestions.map((s, i) => (
                <li
                  key={s.slug}
                  id={`subject-opt-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => { e.preventDefault(); go(s); }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex cursor-pointer items-baseline justify-between gap-4 px-4 py-2.5 ${
                    i === active ? "bg-burgundy-50" : ""
                  }`}
                >
                  <span className="min-w-0 truncate font-semibold text-navy-900">{s.name}</span>
                  <span className="shrink-0 text-sm text-gray-600">{getFacultyName(s.faculty)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Fakulteti">
          {[{ code: "", name: "Të gjitha" }, ...FACULTIES].map((f) => (
            <button
              key={f.code || "all"}
              type="button"
              aria-pressed={faculty === f.code}
              title={f.name}
              onClick={() => setFaculty(f.code)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                faculty === f.code
                  ? "bg-navy-900 text-white"
                  : "bg-white text-navy-800 ring-1 ring-gray-200 hover:ring-burgundy-600"
              }`}
            >
              {f.code || f.name}
            </button>
          ))}
        </div>

        {browse.length === 0 ? (
          <div className="surface-card p-8 text-center text-gray-600">Nuk ka lëndë për këtë fakultet.</div>
        ) : (
          <div className="space-y-6">
            {browse.map(([letter, list]) => (
              <section key={letter} aria-label={`Lëndët me ${letter}`}>
                <h2 className="mb-1 border-b border-gray-200 pb-1 text-sm font-bold text-gray-600">{letter}</h2>
                <ul className="grid gap-x-8 sm:grid-cols-2">
                  {list.map((s) => (
                    <li key={s.slug}>
                      <Link
                        href={`/lenda/${s.slug}`}
                        className="group flex items-baseline justify-between gap-3 rounded-lg px-2 py-2 hover:bg-burgundy-50"
                      >
                        <span className="min-w-0">
                          <span className="font-semibold text-navy-900 group-hover:text-burgundy-600">{s.name}</span>
                          {!faculty && (
                            <span className="ml-2 text-sm text-gray-600" title={getFacultyName(s.faculty)}>
                              {s.faculty}
                            </span>
                          )}
                        </span>
                        <span className="flex shrink-0 items-center gap-1 text-xs text-gray-600">
                          {s.count}
                          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
