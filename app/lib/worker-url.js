/** Public worker / API origin. */
export const WORKER_URL =
  process.env.NEXT_PUBLIC_WORKER_URL ||
  "https://r2-catalog-manager.edonaamulaj.workers.dev";

/** Server-side download redirect that increments download_count before serving the file. */
export function materialDownloadUrl(materialId) {
  if (!materialId) return "#";
  return `${WORKER_URL}/?action=download-material&id=${encodeURIComponent(materialId)}`;
}
