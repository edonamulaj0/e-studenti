"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { FACULTIES, getFacultyName } from "../lib/material-options";

export default function SubjectsClient({ subjects }) {
  const [query, setQuery] = useState("");
  const [faculty, setFaculty] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = subjects.filter(
      (s) => (!faculty || s.faculty === faculty) && (!q || s.name.toLowerCase().includes(q))
    );
    const byFaculty = new Map();
    for (const s of visible) {
      const list = byFaculty.get(s.faculty) || [];
      list.push(s);
      byFaculty.set(s.faculty, list);
    }
    return [...byFaculty.entries()]
      .sort((a, b) => getFacultyName(a[0]).localeCompare(getFacultyName(b[0]), "sq"))
      .map(([code, list]) => [code, list.sort((a, b) => a.name.localeCompare(b.name, "sq"))]);
  }, [subjects, query, faculty]);

  return (
    <div className="page-shell">
      <div className="section-shell">
        <header className="mb-5 max-w-3xl">
          <h1 className="page-title mb-2 !text-3xl md:!text-4xl">Lëndët</h1>
          <p className="page-subtitle !text-base">
            Gjithçka për një lëndë në një vend: afatet e mëparshme, ligjeratat dhe projektet.
          </p>
        </header>

        <div className="mb-6 flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:max-w-xs sm:flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden />
            <input
              type="text"
              placeholder="Kërko lëndë…"
              aria-label="Kërko lëndë"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-srh min-h-[44px] w-full pl-10 text-sm"
            />
          </div>
          <select
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            aria-label="Fakulteti"
            className="input-srh min-h-[44px] text-sm sm:max-w-xs sm:flex-1"
          >
            <option value="">Të gjitha fakultetet</option>
            {FACULTIES.map((f) => (
              <option key={f.code} value={f.code}>{f.name}</option>
            ))}
          </select>
        </div>

        {groups.length === 0 ? (
          <div className="surface-card max-w-xl p-8 text-center text-gray-600">
            Nuk u gjet asnjë lëndë.
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map(([code, list]) => (
              <section key={code} aria-labelledby={`fac-${code}`}>
                <h2 id={`fac-${code}`} className="mb-3 text-lg font-bold text-navy-900">
                  {getFacultyName(code)}
                </h2>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {list.map((s) => (
                    <li key={s.slug}>
                      <Link
                        href={`/lenda/${s.slug}`}
                        className="surface-card flex items-center justify-between gap-3 px-4 py-3 hover:border-burgundy-600/50 hover:shadow-md"
                      >
                        <span className="min-w-0 truncate font-semibold text-navy-900">{s.name}</span>
                        <span className="shrink-0 rounded-full bg-navy-100 px-2 py-0.5 text-xs font-semibold text-navy-800">
                          {s.count}
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
