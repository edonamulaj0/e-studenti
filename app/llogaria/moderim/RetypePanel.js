"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink } from "lucide-react";
import { WORKER_URL, materialViewUrl } from "../../lib/worker-url";
import { MATERIAL_TYPES } from "../../lib/material-options";
import { suggestType } from "../../lib/bulk-upload";
import { useT } from "../../components/Preferences";

const OTHER = "Të tjera";
const PAGE_SIZE = 50;
const MAX_PAGES = 10;
const CHANGES_PER_REQUEST = 100;

function fileName(url) {
  const last = String(url || "").split("/").pop() || "";
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

/**
 * Sorts the materials filed under "Të tjera". Each row starts on the type guessed
 * from its title or file name; the moderator corrects what is wrong and saves the
 * rows that are ticked, all at once.
 */
export default function RetypePanel() {
  const t = useT();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const all = [];
      for (let page = 1; page <= MAX_PAGES; page += 1) {
        const res = await fetch(
          `${WORKER_URL}/?action=moderator-materials&type=${encodeURIComponent(OTHER)}&page=${page}`,
          { credentials: "include" }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Materialet nuk u ngarkuan.");
        all.push(...(data.materials || []));
        if (all.length >= Number(data.total || 0) || (data.materials || []).length < PAGE_SIZE) break;
      }
      setRows(
        all.map((material) => {
          const suggested = suggestType(material);
          return { material, suggested, type: suggested || OTHER, picked: Boolean(suggested) };
        })
      );
    } catch (err) {
      setError(err.message || "Materialet nuk u ngarkuan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = (id, patch) =>
    setRows((current) => current.map((row) => (row.material.id === id ? { ...row, ...patch } : row)));

  const changes = rows
    .filter((row) => row.picked && row.type !== OTHER)
    .map((row) => ({ id: row.material.id, type: row.type }));

  const save = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      let updated = 0;
      for (let i = 0; i < changes.length; i += CHANGES_PER_REQUEST) {
        const res = await fetch(`${WORKER_URL}/?action=retype-materials`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ changes: changes.slice(i, i + CHANGES_PER_REQUEST) }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Ruajtja dështoi.");
        updated += Number(data.updated || 0);
      }
      setNotice(t("U ndryshua lloji i {n} materialeve.", { n: updated }));
      await load();
    } catch (err) {
      setError(err.message || "Ruajtja dështoi.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-surface" role="status" aria-busy="true" />;

  return (
    <>
      <p className="mb-3 text-sm text-gray-600">
        {t("Materialet e ruajtura si “Të tjera”. Lloji i sugjeruar vjen nga titulli ose emri i skedarit; kontrolloni, ndryshoni dhe ruani ato që janë të shënuara.")}
      </p>

      {error && (
        <p role="alert" className="mb-4 rounded-2xl border border-burgundy-600/20 bg-burgundy-50 p-4 text-sm font-semibold text-burgundy-600">
          {t(error)}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-4 rounded-2xl border border-success-green/30 bg-success-green/10 p-4 text-sm font-semibold text-success-text">
          {notice}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-gray-200 bg-surface p-6 text-center text-gray-600">
          {t("Asnjë material nuk është më te “Të tjera”.")}
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-surface p-4">
            <p className="text-sm text-gray-600">
              {t("{n} materiale te “Të tjera”, {s} me sugjerim.", {
                n: rows.length,
                s: rows.filter((row) => row.suggested).length,
              })}
            </p>
            <button
              type="button"
              onClick={save}
              disabled={saving || changes.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              <Check className="h-4 w-4" aria-hidden />
              {saving ? t("Duke ruajtur...") : t("Ruaj {n} ndryshime", { n: changes.length })}
            </button>
          </div>

          <ul className="grid gap-2">
            {rows.map(({ material, suggested, type, picked }) => {
              const selectId = `retype-${material.id}`;
              return (
                <li
                  key={material.id}
                  className="grid gap-3 rounded-2xl border border-gray-200 bg-surface p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
                >
                  <input
                    id={`pick-${material.id}`}
                    type="checkbox"
                    checked={picked}
                    onChange={(e) => update(material.id, { picked: e.target.checked })}
                    aria-label={t("Ndrysho llojin e “{title}”", { title: material.title })}
                    className="h-5 w-5 accent-burgundy-600"
                  />
                  <div className="min-w-0">
                    <a
                      href={materialViewUrl(material.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-1 font-bold text-navy-900 hover:underline"
                    >
                      <span className="truncate">{material.title}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    </a>
                    <p className="truncate text-xs text-gray-500">
                      {[material.subject, fileName(material.r2_url)].filter((v) => v && v !== "//").join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {suggested && type === suggested && (
                      <span className="rounded-full bg-info-blue/10 px-2 py-0.5 text-xs font-semibold text-info-text">
                        {t("sugjerim")}
                      </span>
                    )}
                    <label htmlFor={selectId} className="sr-only">
                      {t("Lloji")}
                    </label>
                    <select
                      id={selectId}
                      value={type}
                      onChange={(e) =>
                        update(material.id, { type: e.target.value, picked: e.target.value !== OTHER })
                      }
                      className="input-srh py-2"
                    >
                      {MATERIAL_TYPES.map((value) => (
                        <option key={value} value={value}>
                          {t(value)}
                        </option>
                      ))}
                    </select>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
