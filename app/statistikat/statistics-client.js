"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Users,
} from "lucide-react";
import { WORKER_URL } from "../lib/worker-url";
import { getFacultyName } from "../lib/material-options";
import { formatStatCount } from "../lib/track-material";

const TRACKING_SINCE_LABEL = "7 KORRIK 2026";

const PERIOD_OPTIONS = [
  { value: "24h", label: "24 orët e fundit" },
  { value: "7d", label: "7 ditët e fundit" },
  { value: "30d", label: "30 ditët e fundit" },
  { value: "365d", label: "Vitin e fundit" },
];

function StatCard({ icon: Icon, label, value, tone = "navy" }) {
  const tones = {
    navy: "bg-navy-100 text-navy-800",
    burgundy: "bg-burgundy-50 text-burgundy-600",
    blue: "bg-info-blue/10 text-info-blue",
    green: "bg-success-green/10 text-success-green",
  };
  return (
    <div className="surface-card p-6">
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <p className="text-sm font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-navy-900">
        {formatStatCount(value ?? 0)}
      </p>
    </div>
  );
}

function formatBucketLabel(bucket, period) {
  if (!bucket) return "";
  if (period === "24h") {
    const date = new Date(`${bucket.replace(" ", "T")}:00:00Z`);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("sq-AL", { hour: "2-digit", minute: "2-digit" });
    }
  }
  if (period === "365d" && /^\d{4}-\d{2}$/.test(bucket)) {
    const [year, monthNum] = bucket.split("-");
    const date = new Date(Number(year), Number(monthNum) - 1, 1);
    return date.toLocaleDateString("sq-AL", { month: "short", year: "numeric" });
  }
  const date = new Date(`${bucket}T12:00:00`);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString("sq-AL", { day: "numeric", month: "short" });
  }
  return bucket;
}

function TrendTooltip({ active, payload, label, preTrackingMessage }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (point?.before_tracking) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
        <p className="font-semibold text-gray-500">{label}</p>
        <p className="text-gray-500">{preTrackingMessage || "Nuk ka të dhëna para kësaj kohe"}</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-semibold text-navy-900">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatStatCount(entry.value)}
        </p>
      ))}
    </div>
  );
}

function TrendChart({ data, period, periodLabel, hasPreTrackingGap, preTrackingMessage }) {
  const firstTrackedIndex = data.findIndex((point) => !point.before_tracking);
  const lastPreTrackingIndex = firstTrackedIndex > 0 ? firstTrackedIndex - 1 : -1;
  const preTrackingStartLabel = lastPreTrackingIndex >= 0 ? data[0]?.label : null;
  const preTrackingEndLabel = lastPreTrackingIndex >= 0 ? data[lastPreTrackingIndex]?.label : null;

  return (
    <section className="surface-card p-6 md:p-7">
      <h2 className="mb-5 text-2xl font-semibold text-navy-900">
        Trendi ({periodLabel.toLowerCase()})
      </h2>
      {hasPreTrackingGap && (
        <p className="mb-4 text-sm text-gray-500">
          {preTrackingMessage || "Nuk ka të dhëna para kësaj kohe"}
        </p>
      )}
      <div className="relative h-80 w-full">
        {hasPreTrackingGap && lastPreTrackingIndex >= 0 && (
          <div
            className="pointer-events-none absolute inset-y-8 z-10 rounded-l-xl border-r border-dashed border-gray-300 bg-navy-100/55 backdrop-blur-[1px]"
            style={{
              left: 0,
              width: `${((lastPreTrackingIndex + 1) / data.length) * 100}%`,
            }}
            aria-hidden
          />
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            {hasPreTrackingGap && preTrackingStartLabel && preTrackingEndLabel && (
              <ReferenceArea
                x1={preTrackingStartLabel}
                x2={preTrackingEndLabel}
                fill="#e2e8f0"
                fillOpacity={0.45}
                strokeOpacity={0}
              />
            )}
            <Tooltip
              content={
                <TrendTooltip preTrackingMessage={preTrackingMessage} />
              }
            />
            <Line
              type="monotone"
              dataKey="views"
              name="Shikime"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="downloads"
              name="Shkarkime"
              stroke="#8B3A3A"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default function StatisticsClient() {
  const [period, setPeriod] = useState("7d");
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = useCallback(async (selectedPeriod) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${WORKER_URL}/?action=site-statistics&period=${encodeURIComponent(selectedPeriod)}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Ngarkimi dështoi.");
      setPayload(data);
    } catch (err) {
      setPayload(null);
      setError(err.message || "Nuk mund të ngarkohen statistikat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats(period);
  }, [period, loadStats]);

  const stats = payload?.stats;
  const periodLabel =
    PERIOD_OPTIONS.find((option) => option.value === period)?.label || period;
  const trackingLabel = payload?.tracking_since_label || TRACKING_SINCE_LABEL;

  const facultyChartData = useMemo(
    () =>
      (stats?.activity_by_faculty || []).map((row) => ({
        faculty: getFacultyName(row.faculty),
        views: row.total_views,
        materials: row.material_count,
      })),
    [stats]
  );

  const trendChartData = useMemo(
    () =>
      (stats?.trend || []).map((row) => ({
        label: formatBucketLabel(row.bucket, period),
        bucket: row.bucket,
        views: row.before_tracking ? 0 : row.views,
        downloads: row.before_tracking ? 0 : row.downloads,
        before_tracking: Boolean(row.before_tracking),
      })),
    [stats, period]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="rounded-2xl border border-navy-100 bg-navy-100/40 px-4 py-3 text-sm text-navy-800 lg:max-w-2xl">
          Të dhënat që nga {trackingLabel}. Numërimi i shikimeve dhe shkarkimeve fillon me
          lançimin e kësaj veçorie.
        </p>

        <div className="flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriod(option.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                period === option.value
                  ? "bg-burgundy-600 text-white"
                  : "bg-white text-navy-800 ring-1 ring-navy-100 hover:bg-burgundy-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="surface-card h-36 animate-pulse bg-navy-100/40" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="surface-card p-8 text-center">
          <BarChart3 className="mx-auto mb-4 h-12 w-12 text-burgundy-600" />
          <p className="text-gray-600">{error}</p>
        </div>
      )}

      {!loading && !error && stats && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard icon={FileText} label="Ngarkime" value={stats.headline?.total_materials} tone="navy" />
            <StatCard icon={Eye} label="Shikime" value={stats.headline?.total_views} tone="blue" />
            <StatCard icon={Download} label="Shkarkime" value={stats.headline?.total_downloads} tone="burgundy" />
            <StatCard icon={Users} label="Përdorues të rinj" value={stats.headline?.total_users} tone="green" />
            <StatCard icon={GraduationCap} label="Fakultete aktive" value={stats.headline?.total_faculties} tone="navy" />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <section className="surface-card p-6 md:p-7">
              <h2 className="mb-5 text-2xl font-semibold text-navy-900">Kontribuesit më aktivë</h2>
              {(stats.top_contributors || []).length === 0 ? (
                <p className="text-gray-600">Ende nuk ka të dhëna publike për këtë periudhë.</p>
              ) : (
                <ol className="space-y-3">
                  {stats.top_contributors.map((contributor, index) => (
                    <li
                      key={`${contributor.name}-${index}`}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-navy-100/35 px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-navy-900">
                          {index + 1}. {contributor.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {contributor.material_count} materiale ·{" "}
                          {formatStatCount(contributor.total_views)} shikime
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-burgundy-600">
                        {formatStatCount(contributor.total_downloads)} shk.
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="surface-card p-6 md:p-7">
              <h2 className="mb-5 text-2xl font-semibold text-navy-900">Materialet më të shikuara</h2>
              {(stats.most_viewed_materials || []).length === 0 ? (
                <p className="text-gray-600">Ende nuk ka shikime të regjistruara për këtë periudhë.</p>
              ) : (
                <ol className="space-y-3">
                  {stats.most_viewed_materials.map((material, index) => (
                    <li key={material.id} className="rounded-2xl bg-navy-100/35 px-4 py-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-navy-900">
                            {index + 1}.{" "}
                            {material.slug ? (
                              <Link
                                href={`/materialet/${material.slug}`}
                                className="hover:text-burgundy-600"
                              >
                                {material.title}
                              </Link>
                            ) : (
                              material.title
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            {getFacultyName(material.faculty)}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-info-blue">
                          {formatStatCount(material.view_count)} shik.
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          <section className="surface-card p-6 md:p-7">
            <h2 className="mb-5 text-2xl font-semibold text-navy-900">Aktiviteti sipas fakultetit</h2>
            {facultyChartData.length === 0 ? (
              <p className="text-gray-600">Ende nuk ka të dhëna për fakultetet në këtë periudhë.</p>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={facultyChartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="faculty" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={70} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="views" name="Shikime" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="materials" name="Materiale" fill="#8B3A3A" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {trendChartData.length > 0 && (
            <TrendChart
              data={trendChartData}
              period={period}
              periodLabel={periodLabel}
              hasPreTrackingGap={Boolean(stats.has_pre_tracking_gap)}
              preTrackingMessage={stats.pre_tracking_message}
            />
          )}

          {payload?.computed_at && (
            <p className="text-center text-xs text-gray-400">
              Përditësuar: {new Date(payload.computed_at).toLocaleString("sq-AL")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
