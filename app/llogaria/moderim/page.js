"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, XCircle, ExternalLink, FileText } from "lucide-react";
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

export default function ModerimPage() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolving, setResolving] = useState(null);

  useEffect(() => {
    fetchCurrentUser().then((user) => {
      if (!user) {
        router.push("/llogaria/hyr");
        return;
      }
      if (!user.is_moderator) {
        router.push("/");
        return;
      }
      loadReports();
    });
  }, [router]);

  const loadReports = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${WORKER_URL}/?action=reports`, {
        credentials: "include",
      });
      if (res.status === 401) {
        router.push("/llogaria/hyr");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Ngarkimi dështoi.");
      setReports(data.reports || []);
    } catch (err) {
      setError(err.message || "Ngarkimi dështoi.");
    } finally {
      setLoading(false);
    }
  };

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
      setError(err.message || "Veprimi dështoi.");
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="min-h-screen bg-srh-paper px-4 py-12">
      <div className="container mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="page-kicker mb-3">Moderim</p>
          <h1 className="font-display text-4xl font-bold text-navy-900 md:text-5xl">
            Raportet e materialeve
          </h1>
          <p className="mt-2 text-gray-600">
            Raportet e hapura nga përdoruesit — zgjidhni ose largoni secilin.
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl border border-burgundy-600/20 bg-burgundy-50 p-4 text-sm font-semibold text-burgundy-600">
            {error}
          </div>
        )}

        {loading ? (
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
                  <div className="flex-1 min-w-0">
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
                          <p className="font-bold text-navy-900 leading-snug">
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
                      className="inline-flex flex-1 md:flex-none min-h-[44px] items-center justify-center gap-2 rounded-xl bg-success-green px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Zgjidh
                    </button>
                    <button
                      type="button"
                      onClick={() => resolve(report.id, "dismiss")}
                      disabled={resolving === report.id}
                      className="inline-flex flex-1 md:flex-none min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 hover:border-gray-400 disabled:opacity-50"
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
      </div>
    </div>
  );
}
