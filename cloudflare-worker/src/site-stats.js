import { assignMaterialSlugs } from "./material-slug.js";

export const TRACKING_SINCE_DATE = "2026-07-07";
export const TRACKING_SINCE_LABEL = "7 KORRIK 2026";

export const STATS_PERIODS = ["24h", "7d", "30d", "365d"];

export const STATS_PERIOD_LABELS = {
  "24h": "24 orët e fundit",
  "7d": "7 ditët e fundit",
  "30d": "30 ditët e fundit",
  "365d": "Vitin e fundit",
};

function periodSinceSql(period) {
  switch (period) {
    case "24h":
      return "datetime('now', '-24 hours')";
    case "7d":
      return "datetime('now', '-7 days')";
    case "30d":
      return "datetime('now', '-30 days')";
    case "365d":
      return "datetime('now', '-365 days')";
    default:
      return "datetime('now', '-7 days')";
  }
}

export function periodStartDate(period, now = Date.now()) {
  const offsets = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "365d": 365 * 24 * 60 * 60 * 1000,
  };
  return new Date(now - (offsets[period] || offsets["7d"]));
}

export function periodHasPreTrackingGap(period, trackingSince, now = Date.now()) {
  if (!STATS_PERIODS.includes(period)) return false;
  const since = new Date(`${trackingSince}T00:00:00.000Z`);
  if (Number.isNaN(since.getTime())) return false;
  return periodStartDate(period, now) < since;
}

function trackingSinceMs(trackingSince) {
  return Date.parse(`${trackingSince}T00:00:00.000Z`);
}

function isBucketBeforeTracking(bucket, period, trackingSince) {
  const trackingMs = trackingSinceMs(trackingSince);
  if (Number.isNaN(trackingMs)) return false;

  if (period === "24h") {
    const ms = Date.parse(`${String(bucket).replace(" ", "T")}:00:00.000Z`);
    return !Number.isNaN(ms) && ms < trackingMs;
  }
  if (period === "365d") {
    const ms = Date.parse(`${bucket}-01T00:00:00.000Z`);
    return !Number.isNaN(ms) && ms < trackingMs;
  }
  const ms = Date.parse(`${bucket}T00:00:00.000Z`);
  return !Number.isNaN(ms) && ms < trackingMs;
}

function generateTrendBuckets(period, now = new Date()) {
  const buckets = [];
  const end = new Date(now);

  if (period === "24h") {
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    start.setUTCMinutes(0, 0, 0);
    for (let cursor = new Date(start); cursor <= end; cursor.setUTCHours(cursor.getUTCHours() + 1)) {
      const y = cursor.getUTCFullYear();
      const m = String(cursor.getUTCMonth() + 1).padStart(2, "0");
      const d = String(cursor.getUTCDate()).padStart(2, "0");
      const h = String(cursor.getUTCHours()).padStart(2, "0");
      buckets.push(`${y}-${m}-${d} ${h}:00`);
    }
    return buckets;
  }

  if (period === "365d") {
    const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 11, 1));
    for (
      let cursor = new Date(start);
      cursor <= end;
      cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1))
    ) {
      buckets.push(
        `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`
      );
    }
    return buckets;
  }

  const days = period === "30d" ? 30 : 7;
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  start.setUTCHours(0, 0, 0, 0);
  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    buckets.push(cursor.toISOString().slice(0, 10));
  }
  return buckets;
}

function mergeTrendRows(period, rawRows, trackingSince, now = new Date()) {
  const byBucket = new Map(
    (rawRows || []).map((row) => [
      row.bucket,
      {
        views: Number(row.views || 0),
        downloads: Number(row.downloads || 0),
      },
    ])
  );

  return generateTrendBuckets(period, now).map((bucket) => {
    const beforeTracking = isBucketBeforeTracking(bucket, period, trackingSince);
    const values = beforeTracking ? { views: 0, downloads: 0 } : byBucket.get(bucket) || { views: 0, downloads: 0 };
    return {
      bucket,
      views: values.views,
      downloads: values.downloads,
      before_tracking: beforeTracking,
    };
  });
}

export async function ensureSiteStatsTable(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS site_stats (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload TEXT NOT NULL,
      computed_at TEXT NOT NULL,
      tracking_since TEXT NOT NULL
    )`
  ).run();
}

async function getTrackingSince(env) {
  await ensureSiteStatsTable(env);
  const row = await env.DB.prepare(
    "SELECT tracking_since FROM site_stats WHERE id = 1"
  ).first();
  if (row?.tracking_since) return row.tracking_since;
  try {
    const firstEvent = await env.DB.prepare(
      "SELECT MIN(created_at) as since FROM material_stat_events"
    ).first();
    if (firstEvent?.since) return firstEvent.since.slice(0, 10);
  } catch {
    // table may not exist yet during first migration
  }
  return TRACKING_SINCE_DATE;
}

async function computePeriodStats(env, period, trackingSince, now = Date.now()) {
  const sinceSql = periodSinceSql(period);
  const trackingSql = `'${trackingSince}'`;
  const hasPreTrackingGap = periodHasPreTrackingGap(period, trackingSince, now);
  const periodStart = periodStartDate(period, now);
  const trackingStartMs = trackingSinceMs(trackingSince);
  const preTrackingRatio =
    hasPreTrackingGap && trackingStartMs > periodStart.getTime()
      ? (trackingStartMs - periodStart.getTime()) / (now - periodStart.getTime())
      : 0;

  const eventWindow = `e.created_at >= ${sinceSql} AND e.created_at >= ${trackingSql}`;
  const materialWindow = `m.created_at >= ${sinceSql} AND m.created_at >= ${trackingSql}`;

  const [
    viewsRow,
    downloadsRow,
    uploadsRow,
    usersRow,
    facultiesRow,
    topContributorsRows,
    topViewedRows,
    facultyActivityRows,
    trendRows,
  ] = await Promise.all([
    env.DB.prepare(
      `SELECT COUNT(*) as count
       FROM material_stat_events e
       WHERE e.event_type = 'view' AND ${eventWindow}`
    ).first(),
    env.DB.prepare(
      `SELECT COUNT(*) as count
       FROM material_stat_events e
       WHERE e.event_type = 'download' AND ${eventWindow}`
    ).first(),
    env.DB.prepare(
      `SELECT COUNT(*) as count
       FROM materials m
       WHERE ${materialWindow}`
    ).first(),
    env.DB.prepare(
      `SELECT COUNT(*) as count FROM users
       WHERE email_verified = 1 AND created_at >= ${sinceSql} AND created_at >= ${trackingSql}`
    ).first(),
    env.DB.prepare(
      `SELECT COUNT(DISTINCT m.faculty) as count
       FROM material_stat_events e
       JOIN materials m ON m.id = e.material_id
       WHERE ${eventWindow}`
    ).first(),
    env.DB.prepare(
      `SELECT
         TRIM(COALESCE(u.name, '') || ' ' || COALESCE(u.surname, '')) as name,
         COUNT(DISTINCT m.id) as material_count,
         SUM(CASE WHEN e.event_type = 'view' THEN 1 ELSE 0 END) as total_views,
         SUM(CASE WHEN e.event_type = 'download' THEN 1 ELSE 0 END) as total_downloads
       FROM material_stat_events e
       JOIN materials m ON m.id = e.material_id
       JOIN users u ON u.id = m.user_id
       WHERE COALESCE(m.is_anonymous, 0) = 0
         AND ${eventWindow}
       GROUP BY u.id
       HAVING total_views > 0 OR total_downloads > 0
       ORDER BY total_views DESC, total_downloads DESC, material_count DESC, name ASC
       LIMIT 10`
    ).all(),
    env.DB.prepare(
      `SELECT m.id, m.title, m.faculty, COUNT(*) as view_count
       FROM material_stat_events e
       JOIN materials m ON m.id = e.material_id
       WHERE e.event_type = 'view'
         AND ${eventWindow}
       GROUP BY m.id
       ORDER BY view_count DESC, m.created_at DESC
       LIMIT 10`
    ).all(),
    env.DB.prepare(
      `SELECT m.faculty,
              COUNT(DISTINCT m.id) as material_count,
              SUM(CASE WHEN e.event_type = 'view' THEN 1 ELSE 0 END) as total_views
       FROM material_stat_events e
       JOIN materials m ON m.id = e.material_id
       WHERE ${eventWindow}
       GROUP BY m.faculty
       ORDER BY total_views DESC, material_count DESC`
    ).all(),
    env.DB.prepare(
      period === "24h"
        ? `SELECT strftime('%Y-%m-%d %H:00', e.created_at) as bucket,
                  SUM(CASE WHEN e.event_type = 'view' THEN 1 ELSE 0 END) as views,
                  SUM(CASE WHEN e.event_type = 'download' THEN 1 ELSE 0 END) as downloads
           FROM material_stat_events e
           WHERE e.created_at >= ${sinceSql}
           GROUP BY bucket
           ORDER BY bucket ASC`
        : period === "365d"
          ? `SELECT strftime('%Y-%m', e.created_at) as bucket,
                    SUM(CASE WHEN e.event_type = 'view' THEN 1 ELSE 0 END) as views,
                    SUM(CASE WHEN e.event_type = 'download' THEN 1 ELSE 0 END) as downloads
             FROM material_stat_events e
             WHERE e.created_at >= ${sinceSql}
             GROUP BY bucket
             ORDER BY bucket ASC`
          : `SELECT date(e.created_at) as bucket,
                    SUM(CASE WHEN e.event_type = 'view' THEN 1 ELSE 0 END) as views,
                    SUM(CASE WHEN e.event_type = 'download' THEN 1 ELSE 0 END) as downloads
             FROM material_stat_events e
             WHERE e.created_at >= ${sinceSql}
             GROUP BY bucket
             ORDER BY bucket ASC`
    ).all(),
  ]);

  const topViewedMaterials = assignMaterialSlugs(topViewedRows.results || []).map(
    (material) => ({
      id: material.id,
      title: material.title,
      faculty: material.faculty,
      slug: material.slug,
      view_count: Number(material.view_count || 0),
      download_count: 0,
    })
  );

  return {
    period,
    available: true,
    label: STATS_PERIOD_LABELS[period],
    has_pre_tracking_gap: hasPreTrackingGap,
    pre_tracking_ratio: Math.min(1, Math.max(0, preTrackingRatio)),
    pre_tracking_message: "Nuk ka të dhëna para kësaj kohe",
    headline: {
      total_materials: Number(uploadsRow?.count || 0),
      total_views: Number(viewsRow?.count || 0),
      total_downloads: Number(downloadsRow?.count || 0),
      total_users: Number(usersRow?.count || 0),
      total_faculties: Number(facultiesRow?.count || 0),
    },
    top_contributors: (topContributorsRows.results || []).map((row) => ({
      name: String(row.name || "").trim(),
      material_count: Number(row.material_count || 0),
      total_views: Number(row.total_views || 0),
      total_downloads: Number(row.total_downloads || 0),
    })),
    most_viewed_materials: topViewedMaterials,
    activity_by_faculty: (facultyActivityRows.results || []).map((row) => ({
      faculty: row.faculty,
      material_count: Number(row.material_count || 0),
      total_views: Number(row.total_views || 0),
    })),
    trend: mergeTrendRows(period, trendRows.results || [], trackingSince, new Date(now)),
  };
}

export async function computeSiteStats(env) {
  if (!env.DB) return null;

  const trackingSince = await getTrackingSince(env);
  const computedAt = new Date().toISOString();
  const periods = {};

  for (const period of STATS_PERIODS) {
    periods[period] = await computePeriodStats(env, period, trackingSince);
  }

  return {
    tracking_since: trackingSince,
    tracking_since_label: TRACKING_SINCE_LABEL,
    computed_at: computedAt,
    periods,
  };
}

export async function storeSiteStats(env, stats) {
  await ensureSiteStatsTable(env);
  await env.DB.prepare(
    `INSERT INTO site_stats (id, payload, computed_at, tracking_since)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       payload = excluded.payload,
       computed_at = excluded.computed_at,
       tracking_since = excluded.tracking_since`
  )
    .bind(JSON.stringify(stats), stats.computed_at, stats.tracking_since)
    .run();
}

export async function loadSiteStats(env, period = "7d") {
  await ensureSiteStatsTable(env);
  const row = await env.DB.prepare(
    "SELECT payload, computed_at, tracking_since FROM site_stats WHERE id = 1"
  ).first();

  let cached = null;
  if (row?.payload) {
    try {
      cached = JSON.parse(row.payload);
      cached.computed_at = row.computed_at || cached.computed_at;
      cached.tracking_since = row.tracking_since || cached.tracking_since;
      cached.tracking_since_label = cached.tracking_since_label || TRACKING_SINCE_LABEL;
    } catch {
      cached = null;
    }
  }

  if (!cached?.periods) {
    cached = await computeSiteStats(env);
    if (cached) await storeSiteStats(env, cached);
  } else {
    const staleCache = Object.values(cached.periods).some(
      (entry) => entry?.available === false || !Array.isArray(entry?.trend)
    );
    if (staleCache) {
      cached = await computeSiteStats(env);
      if (cached) await storeSiteStats(env, cached);
    }
  }

  const normalizedPeriod = STATS_PERIODS.includes(period) ? period : "7d";
  const periodStats =
    cached?.periods?.[normalizedPeriod] ||
    (await computePeriodStats(env, normalizedPeriod, cached?.tracking_since || TRACKING_SINCE_DATE));

  return {
    tracking_since: cached?.tracking_since || TRACKING_SINCE_DATE,
    tracking_since_label: cached?.tracking_since_label || TRACKING_SINCE_LABEL,
    computed_at: cached?.computed_at,
    period: normalizedPeriod,
    stats: periodStats,
  };
}

export async function refreshSiteStats(env) {
  const stats = await computeSiteStats(env);
  if (stats) await storeSiteStats(env, stats);
  return stats;
}
