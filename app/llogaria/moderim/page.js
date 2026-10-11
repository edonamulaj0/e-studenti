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
  Link2,
  Mail,
  PackageCheck,
  BookOpen,
  EyeOff,
  ShieldOff,
  BadgeCheck,
} from "lucide-react";
import { WORKER_URL, materialViewUrl } from "../../lib/worker-url";
import { fetchCurrentUser } from "../../lib/auth";
import { getFacultyName } from "../../lib/material-options";
import { universityShort } from "../../lib/placement";
import { getResourceCategoryLabel } from "../../lib/resource-options";
import { useT } from "../../components/Preferences";

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
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(() => {
    const t = searchParams.get("tab");
    if (t === "materialet") return "materialet";
    if (t === "burime") return "burime";
    if (t === "pritje") return "pritje";
    if (t === "mesazhe") return "mesazhe";
    if (t === "lendet") return "lendet";
    return "raportet";
  });
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

  // ── Resource links ─────────────────────────────────────────────────────
  const [resourceLinks, setResourceLinks] = useState([]);
  const [resourceLinksLoading, setResourceLinksLoading] = useState(false);
  const [moderatingLinkId, setModeratingLinkId] = useState(null);
  const [rejectReasons, setRejectReasons] = useState({});

  // ── Review queue ───────────────────────────────────────────────────────
  const [pending, setPending] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [pendingReasons, setPendingReasons] = useState({});

  // ── Contact messages ───────────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [messagesTotal, setMessagesTotal] = useState(0);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [confirmDeleteMessageId, setConfirmDeleteMessageId] = useState(null);

  // ── Flagged files and uploader trust ───────────────────────────────────
  const [flagThreshold, setFlagThreshold] = useState(3);
  const [unpublishingId, setUnpublishingId] = useState(null);

  // ── Subjects ───────────────────────────────────────────────────────────
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [renaming, setRenaming] = useState(null);
  const [renameTo, setRenameTo] = useState("");

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

  const loadResourceLinks = useCallback(async () => {
    setResourceLinksLoading(true);
    setGlobalError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=moderator-resource-links&status=pending`, {
        credentials: "include",
      });
      if (res.status === 401) { router.push("/llogaria/hyr"); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Ngarkimi dështoi.");
      setResourceLinks(data.links || []);
    } catch (err) {
      setGlobalError(err.message || "Ngarkimi dështoi.");
    } finally {
      setResourceLinksLoading(false);
    }
  }, [router]);

  const loadPending = useCallback(async () => {
    setPendingLoading(true);
    setGlobalError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=moderator-materials&status=pending`, {
        credentials: "include",
      });
      if (res.status === 401) { router.push("/llogaria/hyr"); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Ngarkimi dështoi.");
      setPending(data.materials || []);
    } catch (err) {
      setGlobalError(err.message || "Ngarkimi dështoi.");
    } finally {
      setPendingLoading(false);
    }
  }, [router]);

  const loadMessages = useCallback(async () => {
    setMessagesLoading(true);
    setGlobalError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=contact-messages`, { credentials: "include" });
      if (res.status === 401) { router.push("/llogaria/hyr"); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Ngarkimi dështoi.");
      setMessages(data.messages || []);
      setMessagesTotal(data.total || 0);
    } catch (err) {
      setGlobalError(err.message || "Ngarkimi dështoi.");
    } finally {
      setMessagesLoading(false);
    }
  }, [router]);

  const deleteMessage = async (id) => {
    setGlobalError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=delete-contact-message`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Fshirja dështoi.");
      setMessages((current) => current.filter((item) => item.id !== id));
      setMessagesTotal((total) => Math.max(0, total - 1));
      setConfirmDeleteMessageId(null);
    } catch (err) {
      setGlobalError(err.message || "Fshirja dështoi.");
    }
  };

  const reviewMaterial = async (id, decision) => {
    setReviewingId(id);
    setGlobalError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=review-material`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision, reason: pendingReasons[id] || "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Veprimi dështoi.");
      setPending((current) => current.filter((item) => item.id !== id));
      setPendingReasons((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    } catch (err) {
      setGlobalError(err.message || "Veprimi dështoi.");
    } finally {
      setReviewingId(null);
    }
  };

  const moderateResourceLink = async (id, decision) => {
    setModeratingLinkId(id);
    setGlobalError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=moderate-resource-link`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          decision,
          rejection_reason: rejectReasons[id] || "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Veprimi dështoi.");
      setResourceLinks((current) => current.filter((link) => link.id !== id));
      setRejectReasons((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    } catch (err) {
      setGlobalError(err.message || "Veprimi dështoi.");
    } finally {
      setModeratingLinkId(null);
    }
  };

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
      if (data.flag_threshold) setFlagThreshold(data.flag_threshold);
    } catch (err) {
      setGlobalError(err.message || "Ngarkimi dështoi.");
    } finally {
      setReportsLoading(false);
    }
  }, [router]);

  const loadSubjects = useCallback(async () => {
    setSubjectsLoading(true);
    setGlobalError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=subject-admin`, { credentials: "include" });
      if (res.status === 401) { router.push("/llogaria/hyr"); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Ngarkimi dështoi.");
      setSubjects(data.subjects || []);
    } catch (err) {
      setGlobalError(err.message || "Ngarkimi dështoi.");
    } finally {
      setSubjectsLoading(false);
    }
  }, [router]);

  const renameSubject = async (subject) => {
    const to = renameTo.trim();
    if (!to) return;
    setGlobalError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=rename-subject`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ university: subject.university, faculty: subject.faculty, key: subject.key, to }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Riemërtimi dështoi.");
      setRenaming(null);
      setRenameTo("");
      loadSubjects();
    } catch (err) {
      setGlobalError(err.message || "Riemërtimi dështoi.");
    }
  };

  const unpublish = async (materialId) => {
    setUnpublishingId(materialId);
    setGlobalError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=unpublish-material`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: materialId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Veprimi dështoi.");
      setReports((prev) =>
        prev.map((r) => (r.material_id === materialId ? { ...r, material_status: "pending" } : r))
      );
      loadPending();
    } catch (err) {
      setGlobalError(err.message || "Veprimi dështoi.");
    } finally {
      setUnpublishingId(null);
    }
  };

  const setTrust = async (userId, revoked) => {
    setGlobalError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=set-user-trust`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, revoked }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Veprimi dështoi.");
      setMaterials((prev) =>
        prev.map((m) => (m.uploader_id === userId ? { ...m, uploader_trust_revoked: revoked ? 1 : 0 } : m))
      );
    } catch (err) {
      setGlobalError(err.message || "Veprimi dështoi.");
    }
  };

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
    if (tab === "burime") loadResourceLinks();
    if (tab === "pritje") loadPending();
    if (tab === "mesazhe") loadMessages();
    if (tab === "lendet") loadSubjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- each tab loads its data when it is opened; the loaders are plain functions
  }, [ready, tab]);

  // The queue count is shown on its tab, so load it even from another tab.
  useEffect(() => {
    if (ready && tab !== "pritje") loadPending();
    if (ready && tab !== "mesazhe") loadMessages();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- prefetches the tab counts once, after the moderator check
  }, [ready]);

  useEffect(() => {
    if (!ready || tab !== "materialet") return;
    loadMaterials(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only paging reloads the materials list; tab changes are handled above
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

  const resolveMaterialReports = async (items, action) => {
    for (const report of items) {
      // One at a time: a file has only a few reports, and the alert bookkeeping stays consistent.
      await resolve(report.id, action);
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
      setMaterialsTotal((n) => n - 1);
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

  // Reports grouped by file, the most-reported first (the Worker sorts them so).
  const reportGroups = [];
  for (const r of reports) {
    let group = reportGroups.find((g) => g.material_id === r.material_id);
    if (!group) {
      group = { material_id: r.material_id, first: r, items: [] };
      reportGroups.push(group);
    }
    group.items.push(r);
  }

  const shownSubjects = subjectFilter.trim()
    ? subjects.filter((s) => s.name.toLowerCase().includes(subjectFilter.trim().toLowerCase()))
    : subjects;

  // ── Tab pill styles ────────────────────────────────────────────────────
  const tabCls = (name) =>
    `inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-colors ${
      tab === name
        ? "bg-ink text-white shadow-sm"
        : "text-gray-500 hover:bg-gray-100"
    }`;

  return (
    <div className="bg-srh-paper px-4 py-12">
      <div className="container mx-auto max-w-5xl">

        {/* Header */}
        <header className="mb-8">
          <p className="page-kicker mb-3">{t("Moderim")}</p>
          <h1 className="font-display text-4xl font-bold text-navy-900 md:text-5xl">
            {t("Paneli i moderimit")}
          </h1>
          <p className="mt-2 text-gray-600">
            {t("Shiko dhe menaxho raportet dhe të gjitha materialet e platformës.")}
          </p>
        </header>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-gray-200 bg-surface p-1.5">
          <button type="button" onClick={() => setTab("pritje")} className={tabCls("pritje")}>
            <PackageCheck className="h-4 w-4" />
            {t("Në pritje")}
            {pending.length > 0 && (
              <span className="rounded-full bg-warning-amber/20 px-1.5 py-0.5 text-xs font-bold text-warning-text">
                {pending.length}
              </span>
            )}
          </button>
          <button type="button" onClick={() => setTab("raportet")} className={tabCls("raportet")}>
            <ShieldAlert className="h-4 w-4" />
            {t("Raportet")}
            {reportGroups.length > 0 && (
              <span className="rounded-full bg-warning-amber/20 px-1.5 py-0.5 text-xs font-bold text-warning-text">
                {reportGroups.length}
              </span>
            )}
          </button>
          <button type="button" onClick={() => setTab("materialet")} className={tabCls("materialet")}>
            <Layers className="h-4 w-4" />
            {t("Materialet")}
            {materialsTotal > 0 && (
              <span className="rounded-full bg-navy-100 px-1.5 py-0.5 text-xs font-bold text-navy-700">
                {materialsTotal}
              </span>
            )}
          </button>
          <button type="button" onClick={() => setTab("mesazhe")} className={tabCls("mesazhe")}>
            <Mail className="h-4 w-4" />
            {t("Mesazhe")}
            {messagesTotal > 0 && (
              <span className="rounded-full bg-navy-100 px-1.5 py-0.5 text-xs font-bold text-navy-700">
                {messagesTotal}
              </span>
            )}
          </button>
          <button type="button" onClick={() => setTab("lendet")} className={tabCls("lendet")}>
            <BookOpen className="h-4 w-4" />
            {t("Lëndët")}
          </button>
          <button type="button" onClick={() => setTab("burime")} className={tabCls("burime")}>
            <Link2 className="h-4 w-4" />
            {t("Burime")}
            {resourceLinks.length > 0 && tab !== "burime" && (
              <span className="rounded-full bg-warning-amber/20 px-1.5 py-0.5 text-xs font-bold text-warning-text">
                {resourceLinks.length}
              </span>
            )}
          </button>
        </div>

        {/* Global error */}
        {globalError && (
          <div className="mb-6 rounded-2xl border border-burgundy-600/20 bg-burgundy-50 p-4 text-sm font-semibold text-burgundy-600">
            {t(globalError)}
          </div>
        )}

        {/* ── REPORTS TAB ───────────────────────────────────────────── */}
        {tab === "raportet" && (
          <>
            {reportsLoading ? (
              <div className="grid gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-36 animate-pulse rounded-2xl bg-surface" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-surface p-10 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-success-text" />
                <h2 className="text-xl font-bold text-navy-900">{t("Asnjë raport i hapur")}</h2>
                <p className="mt-2 text-gray-500">{t("Të gjitha raportet janë trajtuar.")}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {reportGroups.map((group) => {
                  const first = group.first;
                  const people = first.open_reports;
                  const flagged = people >= flagThreshold;
                  const busy = group.items.some((r) => resolving === r.id);
                  return (
                    <article
                      key={group.material_id}
                      className={`rounded-2xl border bg-surface p-5 shadow-sm ${
                        flagged ? "border-burgundy-600/50 ring-1 ring-burgundy-600/20" : "border-warning-amber/30"
                      }`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            {flagged ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-burgundy-600 px-2.5 py-1 text-xs font-bold text-white">
                                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                                {t("{n} persona e kanë raportuar", { n: people })}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-amber/20 px-2.5 py-1 text-xs font-bold text-warning-text">
                                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                                {people === 1
                                  ? t("1 person · pragu është {m}", { m: flagThreshold })
                                  : t("{n} persona · pragu është {m}", { n: people, m: flagThreshold })}
                              </span>
                            )}
                            {first.material_status !== "approved" && (
                              <span className="rounded-full bg-navy-100 px-2.5 py-1 text-xs font-bold text-navy-800">
                                {t("Nuk është i publikuar")}
                              </span>
                            )}
                          </div>

                          <div className="mb-3 flex items-start gap-3">
                            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-navy-700" aria-hidden />
                            <div className="min-w-0">
                              <p className="font-bold leading-snug text-navy-900">{first.material_title}</p>
                              <p className="mt-0.5 text-sm text-gray-600">
                                {universityShort(first.material_university)} · {getFacultyName(first.material_faculty)} · {first.material_subject}
                              </p>
                              {first.material_url && (
                                <a
                                  href={first.material_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-burgundy-600 hover:underline"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                                  {t("Hap materialin")}
                                </a>
                              )}
                            </div>
                          </div>

                          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 text-sm">
                            {group.items.map((report) => (
                              <li key={report.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-3 py-2">
                                <span className="font-semibold text-navy-900">{t(report.reason)}</span>
                                <span className="text-xs text-gray-600">
                                  {report.reporter_email
                                    ? `${report.reporter_name || ""} ${report.reporter_surname || ""}`.trim() ||
                                      report.reporter_email
                                    : t("Anonim")}{" "}
                                  · {formatDate(report.created_at)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2 md:w-48 md:flex-col">
                          {first.material_status === "approved" && (
                            <button
                              type="button"
                              onClick={() => unpublish(group.material_id)}
                              disabled={unpublishingId === group.material_id}
                              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-burgundy-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-burgundy-700 disabled:opacity-50 md:flex-none"
                            >
                              <EyeOff className="h-4 w-4" aria-hidden />
                              {t("Hiq nga publikimi")}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => resolveMaterialReports(group.items, "resolve")}
                            disabled={busy}
                            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-success-green px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 md:flex-none"
                          >
                            <CheckCircle2 className="h-4 w-4" aria-hidden />
                            {t("Zgjidh")}
                          </button>
                          <button
                            type="button"
                            onClick={() => resolveMaterialReports(group.items, "dismiss")}
                            disabled={busy}
                            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 hover:border-gray-400 disabled:opacity-50 md:flex-none"
                          >
                            <XCircle className="h-4 w-4" aria-hidden />
                            {t("Largo")}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── SUBJECTS TAB ──────────────────────────────────────────── */}
        {tab === "lendet" && (
          <>
            <p className="mb-3 text-sm text-gray-600">
              {t("Lëndët shkruhen me dorë, kështu që e njëjta lëndë mund të ketë disa shkrime. Riemërto një lëndë për të bashkuar të gjitha shkrimet e saj nën një emër.")}
            </p>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden />
              <input
                type="text"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                aria-label={t("Kërko lëndë")}
                placeholder={t("Kërko lëndë…")}
                className="input-srh pl-11"
              />
            </div>
            {subjectsLoading ? (
              <div className="h-40 animate-pulse rounded-2xl bg-surface" />
            ) : (
              <ul className="grid gap-2">
                {shownSubjects.map((subject) => {
                  const id = `${subject.university}|${subject.faculty}|${subject.key}`;
                  const editing = renaming === id;
                  return (
                    <li key={id} className="rounded-2xl border border-gray-200 bg-surface p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-navy-900">
                            {subject.name}{" "}
                            <span className="font-normal text-gray-600">
                              · {universityShort(subject.university)} · {getFacultyName(subject.faculty)} · {subject.count}
                            </span>
                          </p>
                          {subject.variants.length > 1 && (
                            <p className="mt-0.5 text-xs text-warning-text">
                              {t("Shkrime: {list}", { list: subject.variants.map((v) => `${v.name} (${v.count})`).join(", ") })}
                            </p>
                          )}
                        </div>
                        {!editing && (
                          <button
                            type="button"
                            onClick={() => { setRenaming(id); setRenameTo(subject.name); }}
                            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border-2 border-navy-900 px-3 py-2 text-sm font-bold text-navy-900 hover:bg-ink hover:text-white"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                            {t("Riemërto")}
                          </button>
                        )}
                      </div>
                      {editing && (
                        <form
                          className="mt-3 flex flex-col gap-2 sm:flex-row"
                          onSubmit={(e) => { e.preventDefault(); renameSubject(subject); }}
                        >
                          <input
                            value={renameTo}
                            onChange={(e) => setRenameTo(e.target.value)}
                            aria-label={t("Emri i ri për {name}", { name: subject.name })}
                            maxLength={200}
                            className="input-srh min-h-[40px] flex-1 text-sm"
                          />
                          <button type="submit" className="btn-primary min-h-[40px] px-4 py-2 text-sm">{t("Ruaj")}</button>
                          <button
                            type="button"
                            onClick={() => setRenaming(null)}
                            className="btn-outline min-h-[40px] px-4 py-2 text-sm"
                          >
                            {t("Anulo")}
                          </button>
                        </form>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {/* ── MATERIALS TAB ─────────────────────────────────────────── */}
        {tab === "materialet" && (
          <>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Kërko sipas titullit, lëndës, ose email-it...")}
                className="input-srh pl-11"
              />
            </div>

            {materialsLoading ? (
              <div className="grid gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-surface p-10 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <h2 className="text-xl font-bold text-navy-900">
                  {search ? t("Asnjë rezultat") : t("Nuk ka materiale")}
                </h2>
                <p className="mt-2 text-gray-500">
                  {search ? t("Provoni me terma të tjerë.") : t("Platforma nuk ka materiale ende.")}
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filtered.map((m) => (
                  <article
                    key={m.id}
                    className="rounded-2xl border border-gray-200 bg-surface p-4 shadow-sm md:p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-navy-100/60 px-2 py-0.5 text-xs font-bold text-navy-700">
                            #{m.id}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                            {t(m.type)}
                          </span>
                        </div>
                        <p className="mt-1 truncate font-bold text-navy-900">{m.title}</p>
                        <p className="mt-0.5 text-sm text-gray-500">
                          {universityShort(m.university)} · {getFacultyName(m.faculty)}
                          {m.subject && m.subject !== "//" ? ` · ${m.subject}` : ""}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          {m.pending_owner_email ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-warning-amber/15 px-2 py-0.5 font-semibold text-warning-text">
                              {t("Në pritje — {email}", { email: m.pending_owner_email })}
                            </span>
                          ) : (
                            <>
                              <span>
                                {`${m.uploader_name || ""} ${m.uploader_surname || ""}`.trim() ||
                                  m.uploader_email ||
                                  t("Pa emër")}
                              </span>
                              {m.uploader_email && (
                                <span className="text-gray-300">·</span>
                              )}
                              {m.uploader_email && (
                                <span>{m.uploader_email}</span>
                              )}
                            </>
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
                                {t("Hap")}
                              </a>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {m.uploader_id && !m.pending_owner_email && (
                          <button
                            type="button"
                            onClick={() => setTrust(m.uploader_id, !m.uploader_trust_revoked)}
                            title={
                              m.uploader_trust_revoked
                                ? t("Ky përdorues ka humbur besimin: çdo ngarkim shqyrtohet. Kliko për ta rikthyer.")
                                : t("Ngarkime të miratuara: {n}. Kliko për të hequr besimin.", { n: m.uploader_approved ?? 0 })
                            }
                            className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-sm font-bold ${
                              m.uploader_trust_revoked
                                ? "border-burgundy-600/40 text-burgundy-600 hover:bg-burgundy-50"
                                : "border-gray-200 text-gray-600 hover:border-gray-400"
                            }`}
                          >
                            {m.uploader_trust_revoked ? (
                              <ShieldOff className="h-3.5 w-3.5" aria-hidden />
                            ) : (
                              <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                            )}
                            {m.uploader_trust_revoked ? t("Pa besim") : t("Hiq besimin")}
                          </button>
                        )}
                        {confirmDeleteId === m.id ? (
                          <>
                            <span className="text-sm font-semibold text-gray-600">{t("Jeni i sigurt?")}</span>
                            <button
                              type="button"
                              onClick={() => deleteMaterial(m.id)}
                              disabled={deletingId === m.id}
                              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-burgundy-600 px-3 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                            >
                              {deletingId === m.id ? t("Duke fshirë...") : t("Po, fshi")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border-2 border-gray-200 px-3 py-2 text-sm font-bold text-gray-600 hover:border-gray-400"
                            >
                              {t("Anulo")}
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              href={`/llogaria/ndrysho?id=${m.id}&from=moderim`}
                              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border-2 border-navy-900 px-3 py-2 text-sm font-bold text-navy-900 hover:bg-ink hover:text-white"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              {t("Ndrysho")}
                            </Link>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(m.id)}
                              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border-2 border-burgundy-600/40 px-3 py-2 text-sm font-bold text-burgundy-600 hover:bg-burgundy-600 hover:text-white"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {t("Fshi")}
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
                  {t("Faqja {page} nga {total}", { page, total: totalPages })}
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

        {/* ── REVIEW QUEUE TAB ───────────────────────────────────────── */}
        {tab === "pritje" && (
          <>
            {pendingLoading ? (
              <div className="grid gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-36 animate-pulse rounded-2xl bg-surface" />
                ))}
              </div>
            ) : pending.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-surface p-10 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-success-text" />
                <h2 className="text-xl font-bold text-navy-900">{t("Asnjë material në pritje")}</h2>
                <p className="mt-2 text-gray-500">{t("Të gjitha ngarkimet janë shqyrtuar.")}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pending.map((item) => {
                  const reason = pendingReasons[item.id] || "";
                  const busy = reviewingId === item.id;
                  return (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-warning-amber/30 bg-surface p-6 shadow-sm"
                    >
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                        #{item.id} · {formatDate(item.created_at)} ·{" "}
                        {item.file_type?.toUpperCase()}
                      </p>
                      <h2 className="mt-1 font-bold leading-snug text-navy-900">{item.title}</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        {universityShort(item.university)} · {getFacultyName(item.faculty)} · {item.subject} · {t(item.type)}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {t("Ngarkuar nga {name}", { name: `${item.uploader_name || ""} ${item.uploader_surname || ""}`.trim() || "—" })}
                        {item.uploader_email ? ` (${item.uploader_email})` : ""}
                        {item.is_anonymous ? t(" · postim anonim") : ""}
                      </p>
                      <a
                        href={materialViewUrl(item.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-burgundy-600 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {t("Hap skedarin")}
                      </a>
                      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                        <label className="sr-only" htmlFor={`reject-reason-${item.id}`}>
                          {t("Arsyeja e refuzimit për {title}", { title: item.title })}
                        </label>
                        <input
                          id={`reject-reason-${item.id}`}
                          value={reason}
                          maxLength={300}
                          onChange={(e) =>
                            setPendingReasons((current) => ({ ...current, [item.id]: e.target.value }))
                          }
                          placeholder={t("Arsyeja e refuzimit (e nevojshme për të refuzuar)")}
                          className="input-srh min-h-[44px] flex-1 text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => reviewMaterial(item.id, "approve")}
                            className="btn-primary min-h-[44px] px-4 py-2"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {t("Aprovo")}
                          </button>
                          <button
                            type="button"
                            disabled={busy || reason.trim().length < 5}
                            onClick={() => reviewMaterial(item.id, "reject")}
                            className="btn-outline min-h-[44px] px-4 py-2"
                          >
                            <XCircle className="h-4 w-4" />
                            {t("Refuzo")}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── CONTACT MESSAGES TAB ───────────────────────────────────── */}
        {tab === "mesazhe" && (
          <>
            {messagesLoading ? (
              <div className="grid gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface" />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-surface p-10 text-center">
                <Mail className="mx-auto mb-4 h-12 w-12 text-gray-500" />
                <h2 className="text-xl font-bold text-navy-900">{t("Asnjë mesazh")}</h2>
                <p className="mt-2 text-gray-500">{t("Mesazhet nga formulari i kontaktit shfaqen këtu.")}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {messages.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-gray-200 bg-surface p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                      #{item.id} · {formatDate(item.created_at)}
                    </p>
                    <h2 className="mt-1 font-bold leading-snug text-navy-900">{item.subject}</h2>
                    <p className="text-sm text-gray-500">{t("Nga {name}", { name: item.sender_name })}</p>
                    <p className="mt-3 whitespace-pre-wrap break-words text-gray-700">{item.message}</p>
                    <div className="mt-4">
                      {confirmDeleteMessageId === item.id ? (
                        <span className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => deleteMessage(item.id)}
                            className="btn-primary min-h-[40px] px-4 py-2"
                          >
                            {t("Konfirmo fshirjen")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteMessageId(null)}
                            className="btn-outline min-h-[40px] px-4 py-2"
                          >
                            {t("Anulo")}
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteMessageId(item.id)}
                          className="btn-outline min-h-[40px] px-4 py-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t("Fshi")}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── RESOURCE LINKS TAB ──────────────────────────────────────── */}
        {tab === "burime" && (
          <>
            {resourceLinksLoading ? (
              <div className="grid gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface" />
                ))}
              </div>
            ) : resourceLinks.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-surface p-10 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-success-text" />
                <h2 className="text-xl font-bold text-navy-900">{t("Asnjë lidhje në pritje")}</h2>
                <p className="mt-2 text-gray-500">{t("Të gjitha dërgesat janë trajtuar.")}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {resourceLinks.map((link) => {
                  const flags = link.safety_flags || {};
                  const safeBrowsing = flags.safe_browsing || {};
                  const hasThreats = (safeBrowsing.matches || []).length > 0;
                  return (
                    <article
                      key={link.id}
                      className={`rounded-2xl border bg-surface p-6 shadow-sm ${
                        hasThreats ? "border-burgundy-600/40" : "border-gray-200"
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-navy-900">{link.title}</h3>
                            <span className="rounded-full bg-navy-100 px-2.5 py-0.5 text-xs font-semibold text-navy-800">
                              {t(getResourceCategoryLabel(link.category))}
                            </span>
                          </div>
                          <p className="mb-3 text-sm text-gray-600">{link.description}</p>
                          <div className="mb-3 space-y-1 text-sm">
                            <p>
                              <span className="font-semibold text-navy-900">{t("Origjinal:")}</span>{" "}
                              <a href={link.url} target="_blank" rel="noopener noreferrer" className="break-all text-burgundy-600 hover:underline">
                                {link.url}
                              </a>
                            </p>
                            <p>
                              <span className="font-semibold text-navy-900">{t("Destinacion:")}</span>{" "}
                              <a href={link.resolved_url} target="_blank" rel="noopener noreferrer" className="break-all text-burgundy-600 hover:underline">
                                {link.resolved_url}
                              </a>
                            </p>
                            <p className="font-mono text-xs text-gray-500">
                              {t("Domeni: {domain}", { domain: link.resolved_domain })}
                              {link.was_shortened ? t(" · URL e shkurtuar") : ""}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {flags.was_shortened && (
                              <span className="rounded-full bg-warning-amber/15 px-2.5 py-1 font-semibold text-warning-text">
                                {t("URL e shkurtuar")}
                              </span>
                            )}
                            {hasThreats && (
                              <span className="rounded-full bg-burgundy-50 px-2.5 py-1 font-semibold text-burgundy-600">
                                Safe Browsing: {safeBrowsing.matches.map((m) => m.threatType).join(", ")}
                              </span>
                            )}
                            {safeBrowsing.checked && !hasThreats && (
                              <span className="rounded-full bg-success-green/10 px-2.5 py-1 font-semibold text-success-text">
                                {t("Safe Browsing: pa alarme")}
                              </span>
                            )}
                          </div>
                          <p className="mt-3 text-xs text-gray-500">
                            {getFacultyName(link.faculty)}
                            {link.subject && link.subject !== "//" ? ` · ${link.subject}` : ""}
                            {" · "}
                            {link.submitter_name}
                            {link.submitter_email ? ` (${link.submitter_email})` : ""}
                            {link.is_anonymous ? t(" · anonim publikisht") : ""}
                            {" · "}
                            {formatDate(link.created_at)}
                          </p>
                          <input
                            type="text"
                            placeholder={t("Arsye refuzimi (nëse refuzoni)")}
                            value={rejectReasons[link.id] || ""}
                            onChange={(e) =>
                              setRejectReasons((current) => ({
                                ...current,
                                [link.id]: e.target.value,
                              }))
                            }
                            className="input-srh mt-3 text-sm"
                          />
                        </div>
                        <div className="flex shrink-0 gap-3">
                          <button
                            type="button"
                            onClick={() => moderateResourceLink(link.id, "approve")}
                            disabled={moderatingLinkId === link.id}
                            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-success-green px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {t("Aprovo")}
                          </button>
                          <button
                            type="button"
                            onClick={() => moderateResourceLink(link.id, "reject")}
                            disabled={moderatingLinkId === link.id}
                            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-burgundy-600/40 px-4 py-2.5 text-sm font-bold text-burgundy-600 hover:bg-burgundy-600 hover:text-white disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" />
                            {t("Refuzo")}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
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
