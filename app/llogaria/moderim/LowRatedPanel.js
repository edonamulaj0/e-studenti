"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { WORKER_URL } from "../../lib/worker-url";
import { getFacultyName } from "../../lib/material-options";
import { useT } from "../../components/Preferences";

/**
 * Files that at least three people marked "not useful", and more people than
 * found them useful: candidates to check, replace or take down.
 */
export default function LowRatedPanel() {
  const t = useT();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${WORKER_URL}/?action=low-rated`, { credentials: "include" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Lista nuk u ngarkua.");
        setMaterials(data.materials || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-surface" role="status" aria-busy="true" />;

  return (
    <>
      <p className="mb-4 max-w-2xl text-sm text-gray-600">
        {t("Materialet që të paktën 3 studentë i shënuan si të padobishme, më shumë se sa i shënuan të dobishme. Shikojini: mund të jenë të gabuara, të palexueshme ose në vendin e gabuar.")}
      </p>
      {error && (
        <p role="alert" className="mb-4 text-sm font-semibold text-burgundy-600">
          {t(error)}
        </p>
      )}
      {materials.length === 0 ? (
        <p className="rounded-2xl border border-gray-200 bg-surface p-6 text-center text-gray-600">
          {t("Asnjë material me vlerësim të dobët.")}
        </p>
      ) : (
        <ul className="grid gap-2">
          {materials.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-surface p-4"
            >
              <div className="min-w-0">
                {m.slug ? (
                  <Link href={`/materialet/${m.slug}`} className="font-bold text-navy-900 hover:text-burgundy-600">
                    {m.title}
                  </Link>
                ) : (
                  <p className="font-bold text-navy-900">{m.title}</p>
                )}
                <p className="text-xs text-gray-500">
                  {getFacultyName(m.faculty)} · {m.subject} · {t(m.type)}
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold">
                <span className="inline-flex items-center gap-1 text-burgundy-600">
                  <ThumbsDown className="h-4 w-4" aria-hidden />
                  {m.unhelpful_count}
                </span>
                <span className="inline-flex items-center gap-1 text-gray-600">
                  <ThumbsUp className="h-4 w-4" aria-hidden />
                  {m.helpful_count}
                </span>
                <Link
                  href={`/llogaria/ndrysho?id=${m.id}&from=moderim`}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-navy-900 hover:bg-gray-100"
                >
                  {t("Ndrysho")}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
