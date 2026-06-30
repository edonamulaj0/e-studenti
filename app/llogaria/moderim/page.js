"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  FileText,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Layers,
} from "lucide-react";
import { WORKER_URL } from "../../lib/worker-url";
import { fetchCurrentUser } from "../../lib/auth";
import { getFacultyName } from "../../lib/material-options";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("sq-AL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ModerimPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") === "materialet" ? "materialet" : "raportet");
  const [ready, setReady] = useState(false);
  const [globalError, setGlobalError] = useState("");

  // ── Reports ────────────────────────────────────────────────────────────
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [resolving, setResolving] = useState(null);

  // ── Materials ──────────────────────────────────────────────────────────
  const [materials, setMaterials] = useState([]);
  const [materialsTotal, setMaterialsTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const LIMIT = 50;
  const totalPages = Math.max(1, Math.ceil(materialsTotal / LIMIT));

  // ── Auth guard ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCurrentUser().then((user) => {
      if (!user) { router.push("/llogaria/hyr"); return; }
      if (!user.is_moderator) { router.push("/"); return; }
      setReady(true);
    });
  }, [router]);

  // ── Load reports when tab is active ───────────────────────────────────
  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    setGlobalError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=reports`, { credentials: "include" });
      if (res.status === 401) { router.push("/llogaria/hyr"); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Ngarkimi dështoi.");
      setReports(data.reports || []);
    } catch (err) {
      setGlobalError(err.message || "Ngarkimi dështoi.");
    } finally {
      setReportsLoading(false);
    }
  }, [router]);

  // ── Load materials when tab is active ─────────────────────────────────
  const loadMaterials = useCallback(async (p) => {
    setMaterialsLoading(true);
    setGlobalError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=moderator-materials&page=${p}`, {
        credentials: "include",
      });
      if (res.status === 401) { router.push("/llogaria/hyr"); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Ngarkimi dështoi.");
      setMaterials(data.materials || []);
      setMaterialsTotal(data.total || 0);
    } catch (err) {
      setGlobalError(err.message || "Ngarkimi dështoi.");
    } finally {
      setMaterialsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    if (tab === "raportet") loadReports();
    if (tab === "materialet") { setSearch(""); loadMaterials(page); }
  }, [ready, tab]);

  useEffect(() => {
    if (!ready || tab !== "materialet") return;
    loadMaterials(page);
  }, [page]);

  // ── Resolve report ─────────────────────────────────────────────────────
  const resolve = async (reportId, action) => {
    setResolving(reportId);
    try {
      const res = await fetch(`${WORKER_URL}/?action=resolve-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ report_id: reportId, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Veprimi dështoi.");
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err) {
      setGlobalError(err.message || "Veprimi dështoi.");
    } finally {
      setResolving(null);
    }
  };

  // ── Delete material ────────────────────────────────────────────────────
  const deleteMaterial = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${WORKER_URL}/?action=delete-material`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Fshirja dështoi.");
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      setMaterialsTotal((t) => t - 1);
      setConfirmDeleteId(null);
    } catch (err) {
      setGlobalError(err.message || "Fshirja dështoi.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Client-side search filter ──────────────────────────────────────────
  const filtered = search.trim()
    ? materials.filter((m) => {
        const q = search.toLowerCase();
        return (
          m.title?.toLowerCase().includes(q) ||
          m.subject?.toLowerCase().includes(q) ||
          m.uploader_email?.toLowerCase().includes(q) ||
          `${m.uploader_name || ""} ${m.uploader_surname || ""}`.toLowerCase().includes(q)
        );
      })
    : materials;

  // ── Tab pill styles ────────────────────────────────────────────────────
  const tabCls = (t) =>
    `inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-colors ${
      tab === t
        ? "bg-navy-900 text-white shadow-sm"
        : "text-gray-500 hover:bg-gray-100"
    }`;

  return (
    <div className="min-h-screen bg-srh-paper px-4 py-12">
      <div className="container mx-auto max-w-5xl">

        {/* Header */}
        <header className="mb-8">
          <p className="page-kicker mb-3">Moderim</p>
          <h1 className="font-display text-4xl font-bold text-navy-900 md:text-5xl">
            Paneli i moderimit
          </h1>
          <p className="mt-2 text-gray-600">
            Shiko dhe menaxho raportet dhe të gjitha materialet e platformës.
          </p>
        </header>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 rounded-2xl border border-gray-200 bg-white p-1.5">
          <button type="button" onClick={() => setTab("raportet")} className={tabCls("raportet")}>
            <ShieldAlert className="h-4 w-4" />
            Raportet
            {reports.length > 0 && (
              <span className="rounded-full bg-warning-amber/20 px-1.5 py-0.5 text-xs font-bold text-warning-amber">
                {reports.length}
              </span>
            )}
          </button>
          <button type="button" onClick={() => setTab("materialet")} className={tabCls("materialet")}>
            <Layers className="h-4 w-4" />
            Materialet
            {materialsTotal > 0 && (
              <span className="rounded-full bg-navy-100 px-1.5 py-0.5 text-xs font-bold text-navy-700">
                {materialsTotal}
              </span>
            )}
          </button>
        </div>

        {/* Global error */}
        {globalError && (
          <div className="mb-6 rounded-2xl border border-burgundy-600/20 bg-burgundy-50 p-4 text-sm font-semibold text-burgundy-600">
            {globalError}
          </div>
        )}

        {/* ── REPORTS TAB ───────────────────────────────────────────── */}
        {tab === "raportet" && (
          <>
            {reportsLoading ? (
              <div className="grid gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-36 animate-pulse rounded-2xl bg-white" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-success-green" />
                <h2 className="text-xl font-bold text-navy-900">Asnjë raport i hapur</h2>
                <p className="mt-2 text-gray-500">Të gjitha raportet janë trajtuar.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {reports.map((report) => (
                  <article
                    key={report.id}
                    className="rounded-2xl border border-warning-amber/30 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 shrink-0 text-warning-amber" />
                          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                            Raport #{report.id} · {formatDate(report.created_at)}
                          </span>
                        </div>

                        <div className="mb-4 rounded-xl border border-gray-100 bg-navy-100/30 p-4">
                          <div className="flex items-start gap-3">
                            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-navy-700" />
                            <div className="min-w-0">
                              <p className="font-bold leading-snug text-navy-900">
                                {report.material_title}
                              </p>
                              <p className="mt-1 text-sm text-gray-500">
                                {getFacultyName(report.material_faculty)} · {report.material_subject}
                              </p>
                              {report.material_url && (
                                <a
                                  href={report.material_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-burgundy-600 hover:underline"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  Hap materialin
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-2 text-sm md:grid-cols-2">
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                              Arsyeja
                            </span>
                            <p className="mt-1 font-semibold text-navy-900">{report.reason}</p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                              Raportues
                            </span>
                            <p className="mt-1 font-semibold text-navy-900">
                              {report.reporter_email
                                ? `${report.reporter_name || ""} ${report.reporter_surname || ""}`.trim() ||
                                  report.reporter_email
                                : "Anonim"}
                            </p>
                            {report.reporter_email && (
                              <p className="text-xs text-gray-400">{report.reporter_email}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-3 md:flex-col">
                        <button
                          type="button"
                          onClick={() => resolve(report.id, "resolve")}
                          disabled={resolving === report.id}
                          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-success-green px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 md:flex-none"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Zgjidh
                        </button>
                        <button
                          type="button"
                          onClick={() => resolve(report.id, "dismiss")}
                          disabled={resolving === report.id}
                          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 hover:border-gray-400 disabled:opacity-50 md:flex-none"
                        >
                          <XCircle className="h-4 w-4" />
                          Largo
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── MATERIALS TAB ─────────────────────────────────────────── */}
        {tab === "materialet" && (
          <>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Kërko sipas titullit, lëndës, ose email-it..."
                className="input-srh pl-11"
              />
            </div>

            {materialsLoading ? (
              <div className="grid gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl bg-white" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <h2 className="text-xl font-bold text-navy-900">
                  {search ? "Asnjë rezultat" : "Nuk ka materiale"}
                </h2>
                <p className="mt-2 text-gray-500">
                  {search ? "Provoni me terma të tjerë." : "Platforma nuk ka materiale ende."}
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filtered.map((m) => (
                  <article
                    key={m.id}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-navy-100/60 px-2 py-0.5 text-xs font-bold text-navy-700">
                            #{m.id}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                            {m.type}
                          </span>
                        </div>
                        <p className="mt-1 truncate font-bold text-navy-900">{m.title}</p>
                        <p className="mt-0.5 text-sm text-gray-500">
                          {getFacultyName(m.faculty)}
                          {m.subject && m.subject !== "//" ? ` · ${m.subject}` : ""}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                          <span>
                            {m.is_anonymous
                              ? "Anonim"
                              : `${m.uploader_name || ""} ${m.uploader_surname || ""}`.trim() ||
                                m.uploader_email ||
                                "Pa emër"}
                          </span>
                          {!m.is_anonymous && m.uploader_email && (
                            <span className="text-gray-300">·</span>
                          )}
                          {!m.is_anonymous && m.uploader_email && (
                            <span>{m.uploader_email}</span>
                          )}
                          <span className="text-gray-300">·</span>
                          <span>{formatDate(m.created_at)}</span>
                          {m.r2_url && (
                            <>
                              <span className="text-gray-300">·</span>
                              <a
                                href={m.r2_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-burgundy-600 hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Hap
                              </a>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-2">
                        {confirmDeleteId === m.id ? (
                          <>
                            <span className="text-sm font-semibold text-gray-600">Jeni i sigurt?</span>
                            <button
                              type="button"
                              onClick={() => deleteMaterial(m.id)}
                              disabled={deletingId === m.id}
                              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-burgundy-600 px-3 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                            >
                              {deletingId === m.id ? "Duke fshirë..." : "Po, fshi"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border-2 border-gray-200 px-3 py-2 text-sm font-bold text-gray-600 hover:border-gray-400"
                            >
                              Anulo
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              href={`/llogaria/ndrysho/${m.id}?from=moderim`}
                              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border-2 border-navy-900 px-3 py-2 text-sm font-bold text-navy-900 hover:bg-navy-900 hover:text-white"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Ndrysho
                            </Link>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(m.id)}
                              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border-2 border-burgundy-600/40 px-3 py-2 text-sm font-bold text-burgundy-600 hover:bg-burgundy-600 hover:text-white"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Fshi
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!search && totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || materialsLoading}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-gray-200 font-bold text-gray-600 hover:border-gray-400 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-gray-600">
                  Faqja {page} nga {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || materialsLoading}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-gray-200 font-bold text-gray-600 hover:border-gray-400 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ModerimPage />
    </Suspense>
  );
}
