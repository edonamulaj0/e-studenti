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

export async function fetchAllMaterialsForBuild(limit = 500) {
  const params = new URLSearchParams({
    action: "materials",
    page: "1",
    limit: String(limit),
  });

  try {
    const res = await fetch(`${WORKER_URL}/?${params.toString()}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.materials || data.entries || []).map(sanitizeFetchedMaterial);
  } catch {
    return [];
  }
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
