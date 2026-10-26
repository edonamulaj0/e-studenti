"use client";

import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import ViberIcon from "./ViberIcon";
import { useT } from "./Preferences";

/**
 * Sharing a material where students actually talk: the phone's share sheet
 * when there is one, otherwise straight to Viber or WhatsApp. The link carries
 * a preview image (app/materialet/[slug]/opengraph-image.js).
 */
export default function ShareRow({ title, slug }) {
  const t = useT();
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const url = () => `${window.location.origin}/materialet/${slug}`;
  const message = () => `${title} — ${url()}`;

  const share = async () => {
    try {
      await navigator.share({ title, text: title, url: url() });
    } catch {
      /* closed by the user */
    }
  };

  const linkClass =
    "inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-navy-900 hover:bg-gray-100";

  if (canShare) {
    return (
      <button type="button" onClick={share} className={linkClass}>
        <Share2 className="h-4 w-4" aria-hidden />
        {t("Shpërndaje")}
      </button>
    );
  }
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => {
          window.location.href = `viber://forward?text=${encodeURIComponent(message())}`;
        }}
        className={linkClass}
        aria-label={t("Shpërndaje në Viber")}
      >
        <ViberIcon className="h-4 w-4" />
        Viber
      </button>
      <button
        type="button"
        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(message())}`, "_blank", "noopener,noreferrer")}
        className={linkClass}
        aria-label={t("Shpërndaje në WhatsApp")}
      >
        WhatsApp
      </button>
    </div>
  );
}
