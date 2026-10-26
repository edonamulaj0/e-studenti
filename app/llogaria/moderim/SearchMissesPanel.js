"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquarePlus, X } from "lucide-react";
import { WORKER_URL } from "../../lib/worker-url";
import { useT } from "../../components/Preferences";

/**
 * What students searched for and did not find, most frequent first: content to
 * go and find, or to turn into a request others can answer.
 */
export default function SearchMissesPanel() {
  const t = useT();
  const [misses, setMisses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${WORKER_URL}/?action=search-misses`, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Lista nuk u ngarkua.");
      setMisses(data.misses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dismiss = async (query) => {
    setError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=dismiss-search-miss`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error("Veprimi dështoi.");
      setMisses((current) => current.filter((miss) => miss.query !== query));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-surface" role="status" aria-busy="true" />;

  return (
    <>
      <p className="mb-4 max-w-2xl text-sm text-gray-600">
        {t("Kërkimet pa asnjë rezultat në 90 ditët e fundit, sipas sa herë u bënë. Ruhen vetëm fjalët, pa asnjë të dhënë për kë kërkoi.")}
      </p>
      {error && (
        <p role="alert" className="mb-4 text-sm font-semibold text-burgundy-600">
          {t(error)}
        </p>
      )}
      {misses.length === 0 ? (
        <p className="rounded-2xl border border-gray-200 bg-surface p-6 text-center text-gray-600">
          {t("Asnjë kërkim pa rezultat për momentin.")}
        </p>
      ) : (
        <ul className="grid gap-2">
          {misses.map((miss) => (
            <li
              key={miss.query}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-surface p-4"
            >
              <div className="min-w-0">
                <p className="font-bold text-navy-900">“{miss.query}”</p>
                <p className="text-xs text-gray-500">
                  {t("{n} herë · së fundi më {date}", { n: miss.count, date: String(miss.last_seen || "").slice(0, 10) })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/kerkesat?kerko=${encodeURIComponent(miss.query)}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-navy-900 hover:bg-gray-100"
                >
                  <MessageSquarePlus className="h-4 w-4" aria-hidden />
                  {t("Bëje kërkesë")}
                </Link>
                <button
                  type="button"
                  onClick={() => dismiss(miss.query)}
                  className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-burgundy-600"
                  aria-label={t("Fshih “{q}”", { q: miss.query })}
                  title={t("Fshih")}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
