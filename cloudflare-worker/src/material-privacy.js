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
 * Search text reduced to what people type: lowercase, without diacritics, so
 * "analizë", "Analize" and "ANALIZE" are the same word. Albanian keyboards make
 * ë and ç optional in practice, and searches came back empty when a title used
 * them and the query did not (or the other way round).
 */
export function foldSearchText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Words of a query, folded. Capped so a query stays small: each word costs two
 * bound parameters, and D1 allows 100 per statement alongside the filters.
 */
export function searchTerms(q, max = 5) {
  return foldSearchText(q)
    .split(/[\s,;]+/)
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, max);
}

/**
 * Accented letters folded in SQL. SQLite's LOWER() only knows ASCII, so each
 * uppercase and lowercase form is mapped explicitly. Albanian needs ë and ç; the
 * rest covers names and titles borrowed from neighbouring languages.
 */
const SQL_FOLDS = [
  ["ë", "e"], ["Ë", "e"], ["ç", "c"], ["Ç", "c"],
  ["é", "e"], ["è", "e"], ["É", "e"], ["ü", "u"], ["Ü", "u"], ["ö", "o"], ["Ö", "o"],
  ["á", "a"], ["à", "a"], ["ä", "a"], ["í", "i"], ["ó", "o"], ["ú", "u"],
  ["š", "s"], ["Š", "s"], ["ž", "z"], ["Ž", "z"], ["č", "c"], ["Č", "c"], ["ć", "c"], ["đ", "d"],
];

/** SQL expression giving `column` folded the same way as foldSearchText. */
export function foldSql(column) {
  return SQL_FOLDS.reduce(
    (expr, [from, to]) => `REPLACE(${expr}, '${from}', '${to}')`,
    `LOWER(COALESCE(${column}, ''))`
  );
}

/**
 * WHERE fragment for a multi-word search: every word must appear in one of
 * `columns`, or in one of `privateColumns` where `guard` holds (an uploader's name
 * is searchable only when they did not post anonymously). The columns are joined
 * and folded once per row, so each word costs two parameters however many
 * columns are searched. Words never contain the separator, so a match cannot
 * span two columns.
 */
export function buildFoldedSearchClause(q, columns, { privateColumns = [], guard = "1" } = {}) {
  const terms = searchTerms(q);
  if (!terms.length) return { clause: null, params: [] };
  const joined = (list) => foldSql(list.map((column) => `COALESCE(${column}, '')`).join(" || ' | ' || "));
  const publicText = joined(columns);
  const privateText = privateColumns.length ? joined(privateColumns) : null;
  const perTerm = privateText
    ? `(${publicText} LIKE ? ESCAPE '\\' OR (${guard} AND ${privateText} LIKE ? ESCAPE '\\'))`
    : `${publicText} LIKE ? ESCAPE '\\'`;
  return {
    clause: `(${terms.map(() => perTerm).join(" AND ")})`,
    params: terms.flatMap((term) => Array(privateText ? 2 : 1).fill(likePattern(term))),
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
  const terms = searchTerms(q);
  if (!terms.length) return true;

  const searchable = [material.title, material.subject, material.teacher, material.department, material.type];
  if (!isMaterialAnonymous(material)) {
    searchable.push(material.uploader_name, material.uploaderName);
  }
  const haystack = searchable.filter(Boolean).map(foldSearchText);
  return terms.every((term) => haystack.some((value) => value.includes(term)));
}

/**
 * LIKE pattern matching `q` as plain text. `%` and `_` in the search term are
 * escaped so they match themselves instead of acting as wildcards (a lone "%"
 * would otherwise match every row).
 */
export function likePattern(q) {
  return `%${String(q).replace(/[\\%_]/g, "\\$&")}%`;
}

/** Catalogue search: title, subject, teacher, type, department, and the uploader unless anonymous. */
export function buildPublicSearchClause(q) {
  return buildFoldedSearchClause(q, ["m.title", "m.subject", "m.teacher", "m.type", "m.department"], {
    privateColumns: ["u.name", "u.surname"],
    guard: "COALESCE(m.is_anonymous, 0) = 0",
  });
}
