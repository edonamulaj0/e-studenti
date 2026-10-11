"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Link2, MoreHorizontal } from "lucide-react";
import ReportButton from "./ReportButton";
import { useT } from "./Preferences";

/**
 * The "…" menu on a card or row: copy the link, report the file. The panel is hidden rather
 * than unmounted, so the report dialog (which lives inside ReportButton) survives it closing.
 */
export default function MaterialMenu({ material }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (e.type === "keydown" ? e.key === "Escape" : !ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const copyLink = async () => {
    const url = `${window.location.origin}/materialet/${material.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1200);
    } catch {
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("Më shumë")}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-navy-900"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </button>
      <div
        hidden={!open}
        role="menu"
        className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-gray-200 bg-surface p-1 shadow-lg"
      >
        {material.slug && (
          <button
            type="button"
            role="menuitem"
            onClick={copyLink}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-navy-900 hover:bg-gray-100"
          >
            {copied ? <Check className="h-4 w-4" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
            {copied ? t("U kopjua") : t("Kopjo lidhjen")}
          </button>
        )}
        <ReportButton
          menuItem
          materialId={material.id}
          materialTitle={material.title}
          materialUrl={material.r2Url}
        />
      </div>
    </div>
  );
}
