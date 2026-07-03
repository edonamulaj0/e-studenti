const WORKER_URL =
  process.env.NEXT_PUBLIC_WORKER_URL ||
  "https://r2-catalog-manager.edonaamulaj.workers.dev";

function sanitizeLink(link) {
  if (!link?.is_anonymous) return link;
  const copy = { ...link };
  delete copy.submitter_name;
  return copy;
}

export async function fetchResourceLinksPage({
  page = 1,
  limit = 24,
  faculty = "",
  category = "",
  q = "",
} = {}) {
  const params = new URLSearchParams({
    action: "resource-links",
    page: String(page),
    limit: String(limit),
  });
  if (faculty) params.set("faculty", faculty);
  if (category) params.set("category", category);
  if (q) params.set("q", q);

  try {
    const res = await fetch(`${WORKER_URL}/?${params.toString()}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data.links)) {
      data.links = data.links.map(sanitizeLink);
    }
    return data;
  } catch {
    return null;
  }
}
