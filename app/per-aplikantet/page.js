"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FACULTIES } from "../lib/material-options";
import { WORKER_URL } from "../lib/worker-url";

function FolderIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-12 w-12"
      aria-hidden="true"
    >
      <path
        d="M6 14C6 11.8 7.8 10 10 10H19.2C20.3 10 21.3 10.5 22 11.4L24.8 15H38C40.2 15 42 16.8 42 19V36C42 38.2 40.2 40 38 40H10C7.8 40 6 38.2 6 36V14Z"
        fill="#F5A623"
        fillOpacity="0.18"
      />
      <path
        d="M6 20C6 17.8 7.8 16 10 16H38C40.2 16 42 17.8 42 20V36C42 38.2 40.2 40 38 40H10C7.8 40 6 38.2 6 36V20Z"
        fill="#F5A623"
        fillOpacity="0.35"
      />
      <path
        d="M6 20C6 17.8 7.8 16 10 16H38C40.2 16 42 17.8 42 20V36C42 38.2 40.2 40 38 40H10C7.8 40 6 38.2 6 36V20Z"
        stroke="#F5A623"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
    </svg>
  );
}

export default function PerAplikantetPage() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [totalMaterials, setTotalMaterials] = useState(0);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const params = new URLSearchParams({
          action: "materials",
          type: "Provime Pranuese",
          limit: "500",
        });
        const res = await fetch(`${WORKER_URL}/?${params.toString()}`);
        const data = await res.json().catch(() => ({}));
        const materials = data.materials || data.entries || [];
        const c = {};
        for (const m of materials) {
          const f = String(m.faculty || "").trim().toUpperCase();
          if (f) c[f] = (c[f] || 0) + 1;
        }
        setCounts(c);
        setTotalMaterials(materials.length);
      } catch {
        // keep empty state on error
      } finally {
        setLoading(false);
      }
    }
    fetchCounts();
  }, []);

  const sortedFaculties = [...FACULTIES].sort((a, b) => {
    const ca = counts[a.code] || 0;
    const cb = counts[b.code] || 0;
    if (ca !== cb) return cb - ca;
    return a.name.localeCompare(b.name, "sq");
  });

  return (
    <div className="page-shell">
      <div className="section-shell">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <p className="page-kicker mb-3">Apliko në UP</p>
            <h1 className="page-title mb-3">Për Aplikantët</h1>
            <p className="page-subtitle">
              Materiale nga studentët e mëparshëm për t&apos;ju ndihmuar të
              përgatiteni për UP.
            </p>
          </div>
          <Link
            href="/llogaria/ngarko"
            className="btn-primary shrink-0 self-start"
          >
            Ngarko material ↑
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-2xl bg-gray-200/70"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {sortedFaculties.map((faculty) => {
                const count = counts[faculty.code] || 0;
                return (
                  <Link
                    key={faculty.code}
                    href={`/per-aplikantet/${faculty.code.toLowerCase()}`}
                    className={`surface-card flex flex-col items-center gap-3 p-5 text-center transition-all hover:-translate-y-1 hover:shadow-md hover:border-warning-amber/50 ${
                      count === 0 ? "opacity-50" : ""
                    }`}
                  >
                    <FolderIcon />
                    <span className="text-sm font-semibold leading-snug text-navy-900">
                      {faculty.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {count === 1 ? "1 material" : `${count} materiale`}
                    </span>
                  </Link>
                );
              })}
            </div>

            {totalMaterials === 0 && (
              <div className="mt-12 text-center">
                <p className="text-lg font-semibold text-navy-900">
                  Ky seksion është ende bosh.
                </p>
                <p className="mt-2 text-gray-500">
                  Bëhu i pari që ngarkon materiale për aplikantët.
                </p>
                <Link
                  href="/llogaria/ngarko"
                  className="btn-primary mt-6 inline-flex"
                >
                  Ngarko material →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
