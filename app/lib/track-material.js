import { WORKER_URL } from "./worker-url";

const SESSION_KEY = "srh-stat-session";

function getStatSessionId() {
  if (typeof window === "undefined") return "";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

const trackedViews = new Set();

export async function trackMaterialView(materialId) {
  if (!materialId || typeof window === "undefined") return;
  const key = `view:${materialId}`;
  if (trackedViews.has(key)) return;
  trackedViews.add(key);

  try {
    await fetch(`${WORKER_URL}/?action=track-view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        material_id: materialId,
        session_id: getStatSessionId(),
      }),
    });
  } catch {
    trackedViews.delete(key);
  }
}

export async function trackMaterialDownload(materialId) {
  if (!materialId || typeof window === "undefined") return;
  try {
    await fetch(`${WORKER_URL}/?action=track-download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        material_id: materialId,
        session_id: getStatSessionId(),
      }),
    });
  } catch {
    // non-blocking
  }
}

export function formatStatCount(value) {
  const count = Number(value || 0);
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 10_000) return `${Math.round(count / 1000)}k`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}
