/**
 * Text as people type it into a search box: lowercase, without diacritics, so
 * "analizë" finds "Analize" and the other way round. Same rule as the Worker's
 * catalogue search (cloudflare-worker/src/material-privacy.js).
 */
export function foldSearchText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * True when every word of `query` appears in at least one of `fields`. An empty
 * query matches everything.
 */
export function matchesSearch(query, ...fields) {
  const words = foldSearchText(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = fields.filter(Boolean).map(foldSearchText);
  return words.every((word) => haystack.some((field) => field.includes(word)));
}
