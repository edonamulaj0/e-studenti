export const ANONYMOUS_DISPLAY_NAME = "Anonim";

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
  if (anonymous && !revealUploader) {
    delete sanitized.uploader_name;
    delete sanitized.uploaderName;
    delete sanitized.uploader_surname;
    delete sanitized.uploader_email;
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
    title: material.title,
    faculty: material.faculty,
    department: material.department || "//",
    type: material.type,
    subject: material.subject,
    teacher: material.teacher || "//",
    study_level: material.study_level || "bachelor",
    r2Url: material.r2_url,
    fileType: material.file_type,
    fileSize: material.file_size,
    is_anonymous: isMaterialAnonymous(material) ? 1 : 0,
    submittedBy: displayName
      ? { name: normalizeUploaderName ? normalizeUploaderName(displayName) : displayName }
      : undefined,
  };
}

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

export function buildPublicSearchClause(q) {
  if (!q) return { clause: null, params: [] };
  return {
    clause:
      "(m.title LIKE ? OR m.subject LIKE ? OR m.teacher LIKE ? OR (COALESCE(m.is_anonymous, 0) = 0 AND (u.name LIKE ? OR COALESCE(u.surname, '') LIKE ?)))",
    params: [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`],
  };
}
