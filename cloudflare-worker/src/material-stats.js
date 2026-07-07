const BOT_UA_PATTERN =
  /bot|crawl|spider|slurp|mediapartners|googlebot|bingbot|yandex|duckduckbot|baiduspider|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkshare|w3c_validator|whatsapp|telegrambot|applebot|semrush|ahref|petalbot|bytespider|gptbot|claudebot|anthropic-ai/i;

export function isBotUserAgent(userAgent) {
  return BOT_UA_PATTERN.test(String(userAgent || ""));
}

function utcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function utcWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 1 - day);
  return d.toISOString().slice(0, 10);
}

export async function hashVisitorIdentity(ip, sessionId, secret) {
  const data = new TextEncoder().encode(`${ip}:${sessionId || ""}:${secret || "stats"}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

export function buildDedupeKey(eventType, materialId, visitorHash, date = new Date()) {
  const bucket =
    eventType === "download" ? utcWeekKey(date) : utcDateKey(date);
  return `${eventType}:${materialId}:${visitorHash}:${bucket}`;
}

export async function ensureMaterialStatEventsTable(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS material_stat_events (
      dedupe_key TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      material_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_material_stat_events_type_date ON material_stat_events(event_type, created_at)"
  ).run();
}

export async function recordMaterialStatEvent(env, { eventType, materialId, dedupeKey }) {
  await ensureMaterialStatEventsTable(env);
  try {
    await env.DB.prepare(
      "INSERT INTO material_stat_events (dedupe_key, event_type, material_id) VALUES (?, ?, ?)"
    )
      .bind(dedupeKey, eventType, materialId)
      .run();
    return true;
  } catch (error) {
    if (String(error.message || error).includes("UNIQUE")) {
      return false;
    }
    throw error;
  }
}

export async function incrementMaterialCounter(env, materialId, column) {
  if (!["view_count", "download_count"].includes(column)) {
    throw new Error("Invalid stats column");
  }
  const result = await env.DB.prepare(
    `UPDATE materials SET ${column} = COALESCE(${column}, 0) + 1 WHERE id = ?`
  )
    .bind(materialId)
    .run();
  return Number(result.meta?.changes || 0) > 0;
}

export function rateLimitIdentity(request) {
  const forwardedFor = request.headers.get("X-Forwarded-For") || "";
  return (
    request.headers.get("CF-Connecting-IP") ||
    forwardedFor.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function trackMaterialEvent(request, env, eventType) {
  if (!env.DB) return { ok: false, reason: "no_db" };

  const userAgent = request.headers.get("User-Agent") || "";
  if (isBotUserAgent(userAgent)) {
    return { ok: false, reason: "bot" };
  }

  const body = await request.json().catch(() => ({}));
  const materialId = Number(body.material_id);
  if (!Number.isFinite(materialId) || materialId <= 0) {
    return { ok: false, reason: "invalid_id" };
  }

  const material = await env.DB.prepare("SELECT id FROM materials WHERE id = ?")
    .bind(materialId)
    .first();
  if (!material) {
    return { ok: false, reason: "not_found" };
  }

  const sessionId = String(body.session_id || "").trim().slice(0, 64);
  const ip = rateLimitIdentity(request);
  const visitorHash = await hashVisitorIdentity(ip, sessionId, env.JWT_SECRET);
  const dedupeKey = buildDedupeKey(eventType, materialId, visitorHash);
  const inserted = await recordMaterialStatEvent(env, {
    eventType,
    materialId,
    dedupeKey,
  });
  if (!inserted) {
    return { ok: true, counted: false, reason: "deduped" };
  }

  const column = eventType === "view" ? "view_count" : "download_count";
  await incrementMaterialCounter(env, materialId, column);
  return { ok: true, counted: true };
}
