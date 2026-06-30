"use client";

import { useState } from "react";
import { Flag, X, ExternalLink } from "lucide-react";
import { WORKER_URL } from "../lib/worker-url";

const REASONS = [
  "Përmbajtje e papërshtatshme",
  "Material i gabuar ose jo akademik",
  "Kopje e materialit ekzistues",
  "Shkelje e të drejtave të autorit",
  "Tjetër",
];

export default function ReportButton({ materialId, materialTitle, materialUrl }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const close = () => {
    setOpen(false);
    setReason("");
    setError("");
    if (status !== "done") setStatus("idle");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!reason) return;
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ material_id: materialId, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Raportimi dështoi.");
      setStatus("done");
    } catch (err) {
      setError(err.message || "Raportimi dështoi.");
      setStatus("idle");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 underline decoration-dotted underline-offset-4 transition-colors hover:text-burgundy-600"
      >
        <Flag className="w-4 h-4" />
        Raporto
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/50 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Raporto material
                </p>
                <h2 className="truncate text-lg font-bold leading-snug text-navy-900">
                  {materialTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                className="shrink-0 rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Mbyll"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {materialUrl && (
              <a
                href={materialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-5 flex items-center gap-2 rounded-xl border border-gray-200 bg-navy-100/30 px-4 py-3 text-sm font-semibold text-navy-800 transition-colors hover:border-burgundy-600 hover:text-burgundy-600"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span className="truncate">{materialUrl}</span>
              </a>
            )}

            {status === "done" ? (
              <div className="rounded-xl bg-success-green/10 p-5 text-center">
                <p className="font-bold text-success-green">
                  Faleminderit! Raporti u dërgua.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-3 text-sm font-semibold text-gray-500 hover:underline"
                >
                  Mbyll
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy-900">
                    Arsyeja e raportimit
                  </label>
                  <select
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="input-srh text-sm"
                  >
                    <option value="">Zgjidhni arsyen…</option>
                    {REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                {error && (
                  <p className="text-sm font-semibold text-burgundy-600">{error}</p>
                )}
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={!reason || status === "loading"}
                    className="flex-1 rounded-xl bg-burgundy-600 py-2.5 text-sm font-bold text-white hover:bg-burgundy-700 disabled:opacity-50"
                  >
                    {status === "loading" ? "Duke dërguar…" : "Dërgo raportin"}
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Anulo
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
