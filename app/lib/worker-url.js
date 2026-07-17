/** Public API origin (Cloudflare Worker on custom domain). */
export const WORKER_URL =
  process.env.NEXT_PUBLIC_WORKER_URL || "https://api.e-studenti.com";

/** Server-side view redirect that increments view_count before opening the file. */
export function materialViewUrl(materialId) {
  if (!materialId) return "#";
  return `${WORKER_URL}/?action=view-material&id=${encodeURIComponent(materialId)}`;
}

/** Server-side download redirect that increments download_count before serving the file. */
export function materialDownloadUrl(materialId) {
  if (!materialId) return "#";
  return `${WORKER_URL}/?action=download-material&id=${encodeURIComponent(materialId)}`;
}
