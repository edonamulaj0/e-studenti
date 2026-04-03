/** Deterministic slugs for Erasmus calls (sync script + stable JSON ids). */

export function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function erasmusSlugForCall(call, index) {
  const key = `${call.title}\n${call.date || ""}\n${index}`;
  const part = hashString(key).slice(0, 10);
  const datePart = (call.date || "na").replace(/-/g, "");
  return `${datePart}-${part}`;
}

export function assignSlugsToCalls(calls) {
  return calls.map((c, i) => ({
    ...c,
    slug: c.slug || erasmusSlugForCall(c, i),
  }));
}

export function isListingOnlyUrl(href) {
  try {
    const u = new URL(href);
    const id = decodeURIComponent(u.searchParams.get("id") || "").trim();
    return id === "1,39";
  } catch {
    return true;
  }
}
