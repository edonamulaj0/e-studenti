"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquarePlus, Upload } from "lucide-react";
import { WORKER_URL } from "../lib/worker-url";
import { useT } from "./Preferences";

/** Below this many materials a place counts as thin and asks for more. */
const THIN = 10;

/**
 * Where the library is empty or thin, says so and asks for the first
 * materials, instead of leaving an empty page to speak for itself. Counts are
 * read live, so the prompt goes away as uploads arrive.
 *
 * @param {{ name: string, faculty?: string, university?: string }} props
 */
export default function ContributeCallout({ name, faculty = "", university = "" }) {
  const t = useT();
  const [total, setTotal] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams({ action: "materials", limit: "1" });
    if (faculty) params.set("faculty", faculty.toUpperCase());
    if (university) params.set("university", university);
    let cancelled = false;
    fetch(`${WORKER_URL}/?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.pagination) setTotal(Number(data.pagination.total || 0));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [faculty, university]);

  if (total === null || total >= THIN) return null;

  const place = new URLSearchParams();
  if (university) place.set("university", university);
  if (faculty) place.set("faculty", faculty.toUpperCase());
  const query = place.toString();

  return (
    <section
      aria-label={t("Kontribuo")}
      className="mb-8 rounded-2xl border border-burgundy-600/20 bg-burgundy-50 p-5 md:p-6"
    >
      <p className="font-bold text-navy-900">
        {total === 0
          ? t("Ende nuk ka materiale për {name}.", { name })
          : t("Vetëm {n} materiale për {name} deri tani.", { n: total, name })}
      </p>
      <p className="mt-1 text-sm text-gray-700">
        {t("Keni afate, ligjërata apo shënime? Ngarkojini që t'i gjejë edhe shoku i radhës — ose kërkoni atë që ju mungon.")}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/llogaria/ngarko${query ? `?${query}` : ""}`}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white"
        >
          <Upload className="h-4 w-4" aria-hidden />
          {total === 0 ? t("Ngarko të parin") : t("Ngarko material")}
        </Link>
        <Link
          href={`/kerkesat${query ? `?${query}` : ""}`}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gray-300 bg-surface px-4 py-2 text-sm font-bold text-navy-900 hover:bg-gray-100"
        >
          <MessageSquarePlus className="h-4 w-4" aria-hidden />
          {t("Kërko një material")}
        </Link>
      </div>
    </section>
  );
}
