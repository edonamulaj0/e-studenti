"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { getProgramme, getUniversity } from "../lib/directory";
import { useT } from "./Preferences";

const KEY = "compare-first";
const CompareContext = createContext({ first: null, start: () => {}, clear: () => {} });

export const useCompare = () => useContext(CompareContext);

/** Remembers the first programme picked for comparison while the visitor browses. */
export default function CompareProvider({ children }) {
  const [first, setFirst] = useState(null);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(KEY);
      if (saved && getProgramme(saved)) setFirst(saved);
    } catch {
      /* storage can be blocked; the comparison just won't survive a reload */
    }
  }, []);

  const start = useCallback((id) => {
    setFirst(id);
    try {
      window.sessionStorage.setItem(KEY, id);
    } catch {
      /* ignore */
    }
  }, []);
  const clear = useCallback(() => {
    setFirst(null);
    try {
      window.sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ first, start, clear }), [first, start, clear]);
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

/** The strip under the navbar while a comparison is half-chosen. */
export function CompareStrip() {
  const t = useT();
  const { first, clear } = useCompare();
  const programme = first ? getProgramme(first) : null;
  if (!programme) return null;
  const university = getUniversity(programme.uni);
  return (
    <div
      role="region"
      aria-label={t("Krahasimi")}
      className="sticky top-[4.25rem] z-40 border-b border-burgundy-600/20 bg-burgundy-50 md:top-20"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 text-sm md:px-6">
        <p className="min-w-0 text-navy-900">
          {t("Krahaso")}{" "}
          <Link
            href={`/universitetet/${programme.uni}`}
            className="font-bold text-burgundy-600 hover:underline"
          >
            {programme.name} – {university?.name.replace(/"/g, "")}
          </Link>{" "}
          {t("me…")}
          <span className="ml-2 hidden text-gray-600 sm:inline">
            {t("zgjidhni një program tjetër nga cilido universitet")}
          </span>
        </p>
        <button
          type="button"
          onClick={clear}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold text-burgundy-600 hover:bg-burgundy-600 hover:text-white"
        >
          <X className="h-4 w-4" aria-hidden />
          {t("Anulo")}
        </button>
      </div>
    </div>
  );
}
