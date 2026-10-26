"use client";

import { useEffect, useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { WORKER_URL } from "../lib/worker-url";
import { useT } from "./Preferences";

/**
 * "Was this useful?" One vote per person, which a second press withdraws.
 * The totals help the next student pick the better file, and files most
 * people found unhelpful are shown to the moderator.
 */
export default function HelpfulVote({ materialId }) {
  const t = useT();
  const [rating, setRating] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`${WORKER_URL}/?action=material-rating&material_id=${encodeURIComponent(materialId)}`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setRating(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [materialId]);

  if (!rating) return null;

  const cast = async (helpful) => {
    const next = rating.mine === helpful ? null : helpful;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=rate-material`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material_id: Number(materialId), helpful: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Vota nuk u ruajt.");
      setRating(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const button = (helpful, Icon, count, label) => {
    const chosen = rating.mine === helpful;
    return (
      <button
        type="button"
        onClick={() => cast(helpful)}
        disabled={busy}
        aria-pressed={chosen}
        aria-label={label}
        title={label}
        className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 text-sm font-bold transition-colors disabled:opacity-60 ${
          chosen
            ? "border-burgundy-600 bg-burgundy-50 text-burgundy-600"
            : "border-gray-300 text-navy-900 hover:bg-gray-100"
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden />
        {count}
      </button>
    );
  };

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-gray-600">{t("Ju ndihmoi ky material?")}</p>
      <div className="flex gap-2">
        {button(true, ThumbsUp, rating.helpful, t("Po, më ndihmoi"))}
        {button(false, ThumbsDown, rating.unhelpful, t("Jo, nuk më ndihmoi"))}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs font-semibold text-burgundy-600">
          {t(error)}
        </p>
      )}
    </div>
  );
}
