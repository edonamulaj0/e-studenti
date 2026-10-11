import { WORKER_URL } from "./worker-url";

function sanitizeFetchedMaterial(material) {
  if (!material || typeof material !== "object") return material;
  const copy = { ...material };
  delete copy.user_id;
  delete copy.file_key;
  delete copy.fileKey;
  delete copy.pending_owner_email;
  delete copy.uploader_email;
  if (copy.is_anonymous) {
    delete copy.uploader_name;
  }
  return copy;
}

export async function fetchMaterialsPage({
  page = 1,
  limit = 24,
  faculty = "",
  type = "",
  q = "",
  niveli = "",
} = {}) {
  const params = new URLSearchParams({
    action: "materials",
    page: String(page),
    limit: String(limit),
  });
  if (faculty) params.set("faculty", faculty);
  if (type) params.set("type", type);
  if (q) params.set("q", q);
  if (niveli) params.set("niveli", niveli);

  try {
    const res = await fetch(`${WORKER_URL}/?${params.toString()}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data.materials)) {
      data.materials = data.materials.map(sanitizeFetchedMaterial);
    }
    if (Array.isArray(data.entries)) {
      data.entries = data.entries.map((entry) =>
        entry.is_anonymous || entry.submittedBy?.name === "Anonim"
          ? { ...entry, submittedBy: { name: "Anonim" } }
          : entry
      );
    }
    return data;
  } catch {
    return null;
  }
}

/** The Worker caps `limit` at 100, so a full listing has to be paged. */
const BUILD_PAGE_SIZE = 100;
const BUILD_MAX_PAGES = 200;

/**
 * Every published material, for generating pages and the sitemap at build time.
 * Throws if the API cannot be read: a build made from a partial or empty list
 * would silently ship a site without its material pages, and a failed build
 * leaves the previous deployment running.
 */
export async function fetchAllMaterialsForBuild() {
  const all = [];
  for (let page = 1; page <= BUILD_MAX_PAGES; page += 1) {
    const params = new URLSearchParams({
      action: "materials",
      page: String(page),
      limit: String(BUILD_PAGE_SIZE),
    });
    const res = await fetch(`${WORKER_URL}/?${params.toString()}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      throw new Error(`Could not list materials for the build: ${WORKER_URL} answered ${res.status}`);
    }
    const data = await res.json();
    all.push(...(data.materials || data.entries || []).map(sanitizeFetchedMaterial));
    if (!data.pagination?.hasNextPage) break;
  }
  return all;
}

export async function fetchMaterialBySlug(slug) {
  const params = new URLSearchParams({
    action: "material-public",
    slug,
  });

  try {
    const res = await fetch(`${WORKER_URL}/?${params.toString()}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.material || null;
  } catch {
    return null;
  }
}
