"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { WORKER_URL } from "../../lib/worker-url";
import MaterialCard, { normalizeMaterial } from "../../components/MaterialCard";

export default function FacultyClient({ faculty }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMaterials() {
      try {
        const params = new URLSearchParams({
          action: "materials",
          type: "Provime Pranuese",
          faculty: faculty.code,
          limit: "100",
        });
        const res = await fetch(`${WORKER_URL}/?${params.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Gabim gjatë ngarkimit.");
        const raw = data.materials || data.entries || [];
        setMaterials(raw.map(normalizeMaterial));
      } catch {
        setError("Nuk mund të ngarkohen materialet. Provoni përsëri.");
      } finally {
        setLoading(false);
      }
    }
    fetchMaterials();
  }, [faculty.code]);

  return (
    <div className="page-shell">
      <div className="section-shell">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-500">
          <Link
            href="/per-aplikantet"
            className="hover:text-burgundy-600 transition-colors"
          >
            Për Aplikantët
          </Link>
          <span>/</span>
          <span className="text-navy-900">{faculty.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="page-title">{faculty.name}</h1>
          <Link
            href="/llogaria/ngarko"
            className="btn-primary shrink-0 self-start"
          >
            Ngarko material ↑
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-3xl bg-gray-200/70"
              />
            ))}
          </div>
        ) : error ? (
          <div className="surface-card mx-auto max-w-xl p-10 text-center">
            <FileText className="mx-auto mb-5 h-16 w-16 text-burgundy-600" />
            <p className="text-gray-600">{error}</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="mt-8 text-center">
            <p className="text-lg font-semibold text-navy-900">
              Asnjë material për këtë fakultet ende.
            </p>
            <p className="mt-2 text-gray-500">
              Bëhu i pari që ngarkon për {faculty.name}.
            </p>
            <Link href="/llogaria/ngarko" className="btn-primary mt-6 inline-flex">
              Ngarko material →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {materials.map((m) => (
              <MaterialCard key={m.id} material={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
