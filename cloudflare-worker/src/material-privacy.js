export const ANONYMOUS_DISPLAY_NAME = "Anonim";

/** Fields that must never appear on public catalog / detail payloads. */
const PUBLIC_STRIP_FIELDS = [
  "user_id",
  "file_key",
  "fileKey",
  "pending_owner_email",
  "uploader_email",
  "uploader_surname",
  "moderator_id",
  "rejection_reason",
  // Moderation and upload bookkeeping: who reviewed it (a user id), and the
  // uploader's file hash and retry id.
  "reviewed_by",
  "reviewed_at",
  "content_hash",
  "client_upload_id",
];

export function isMaterialAnonymous(material) {
  return Boolean(material?.is_anonymous);
}

export function getPublicUploaderName(material) {
  if (isMaterialAnonymous(material)) return ANONYMOUS_DISPLAY_NAME;
  const raw =
    material?.uploader_name ||
    material?.uploaderName ||
    material?.submittedBy?.name ||
    "";
  return String(raw).trim();
}

export function sanitizeMaterialForPublic(material, { revealUploader = false } = {}) {
  if (!material || typeof material !== "object") return material;
  const anonymous = isMaterialAnonymous(material);
  const displayName = revealUploader
    ? String(material.uploader_name || material.uploaderName || "").trim()
    : getPublicUploaderName(material);

  const sanitized = { ...material };
  for (const field of PUBLIC_STRIP_FIELDS) {
    delete sanitized[field];
  }

  if (anonymous && !revealUploader) {
    delete sanitized.uploader_name;
    delete sanitized.uploaderName;
    // A "trusted contributor" mark would single out an anonymous upload.
    delete sanitized.uploader_trusted;
  } else if (displayName) {
    sanitized.uploader_name = displayName;
  }

  sanitized.is_anonymous = anonymous ? 1 : 0;
  return sanitized;
}

export function materialToPublicLegacyEntry(material, normalizeUploaderName) {
  const displayName = getPublicUploaderName(material);
  return {
    id: material.id,
    slug: material.slug,
    title: material.title,
    faculty: material.faculty,
    department: material.department || "//",
    type: material.type,
    subject: material.subject,
    teacher: material.teacher || "//",
    study_level: material.study_level || "bachelor",
    view_count: Number(material.view_count || 0),
    download_count: Number(material.download_count || 0),
    r2Url: material.r2_url,
    fileType: material.file_type,
    fileSize: material.file_size,
    is_anonymous: isMaterialAnonymous(material) ? 1 : 0,
    submittedBy: displayName
      ? { name: normalizeUploaderName ? normalizeUploaderName(displayName) : displayName }
      : undefined,
    uploader_trusted: isMaterialAnonymous(material) ? undefined : Boolean(material.uploader_trusted),
  };
}

/**
 * @param {Record<string, any>} material
 * @param {{ faculty?: string, type?: string, q?: string, studyLevel?: string }} [filters]
 */
export function materialMatchesPublic(material, { faculty, type, q, studyLevel } = {}) {
  if (faculty && material.faculty !== faculty.toUpperCase()) return false;
  if (type && material.type !== type) return false;
  if (studyLevel && (material.study_level || "bachelor") !== studyLevel) return false;
  if (!q) return true;

  const needle = q.toLowerCase();
  const searchable = [
    material.title,
    material.subject,
    material.teacher,
    material.department,
  ];
  if (!isMaterialAnonymous(material)) {
    searchable.push(material.uploader_name, material.uploaderName);
  }
  return searchable
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle));
}

/**
 * LIKE pattern matching `q` as plain text. `%` and `_` in the search term are
 * escaped so they match themselves instead of acting as wildcards (a lone "%"
 * would otherwise match every row).
 */
export function likePattern(q) {
  return `%${String(q).replace(/[\\%_]/g, "\\$&")}%`;
}

export function buildPublicSearchClause(q) {
  if (!q) return { clause: null, params: [] };
  return {
    clause:
      "(m.title LIKE ? ESCAPE '\\' OR m.subject LIKE ? ESCAPE '\\' OR m.teacher LIKE ? ESCAPE '\\' OR (COALESCE(m.is_anonymous, 0) = 0 AND (u.name LIKE ? ESCAPE '\\' OR COALESCE(u.surname, '') LIKE ? ESCAPE '\\')))",
    params: Array(5).fill(likePattern(q)),
  };
}
