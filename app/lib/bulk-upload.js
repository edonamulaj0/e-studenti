import { MATERIAL_TYPES } from "./material-options";

/**
 * Pure logic for the multi-file upload page: guessing metadata from file names,
 * validating rows, building requests and deciding which uploads may start. Kept
 * free of React and the DOM so it can be tested on its own.
 */

/** Must stay in sync with the Worker's limits (MAX_FILE_SIZE, ALLOWED_EXTENSIONS). */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "zip"];
export const MAX_FILES_PER_BATCH = 50;
/** Files sent at the same time. The Worker holds each upload in memory. */
export const UPLOAD_CONCURRENCY = 2;
/** Cap on the bytes in flight at once, so two large files cannot exhaust the Worker. */
export const IN_FLIGHT_BYTE_BUDGET = 64 * 1024 * 1024;

export const PRANUES = "Provime Pranuese";

export function fileExtension(name) {
  const dot = String(name || "").lastIndexOf(".");
  return dot === -1 ? "" : String(name).slice(dot + 1).toLowerCase();
}

function fold(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Best-effort title and type from a file name. Only a starting point for the
 * uploader to correct; nothing here is trusted.
 */
export function inferMetadata(filename) {
  const base = String(filename || "").replace(/\.[^.]+$/, "");
  const title = base
    .replace(/[_]+/g, " ")
    .replace(/\s*-\s*/g, " - ")
    .replace(/\s*\(\d+\)\s*$/, "")
    .replace(/\s+copy$/i, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);

  const haystack = fold(base);
  const ext = fileExtension(filename);
  let type = null;
  if (/pranues/.test(haystack)) type = PRANUES;
  else if (/\bafat|\bprovim/.test(haystack)) type = "Afat";
  else if (/projekt|seminar/.test(haystack)) type = "Projekt";
  else if (/\bliber|\blibr|\bbook/.test(haystack)) type = "Libër";
  else if (/ligjerat|lecture|slajd|slide|ppt|prezantim/.test(haystack) || ext === "ppt" || ext === "pptx") {
    type = "Ligjerata";
  }
  return { title, type: MATERIAL_TYPES.includes(type) ? type : null };
}

/** What would actually be sent for a row: the shared defaults, then its own edits. */
export function effectiveFields(row, defaults) {
  const merged = { ...defaults, title: row.inferred?.title || "" };
  if (row.inferred?.type && !defaults.typeLocked) merged.type = row.inferred.type;
  for (const [key, value] of Object.entries(row.overrides || {})) merged[key] = value;
  if (merged.type === PRANUES) {
    merged.department = "//";
    merged.subject = "//";
    merged.teacher = "//";
  }
  return merged;
}

export function formatMegabytes(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "");
}

/** Problems that would make the Worker refuse the file, found before anything is sent. */
export function validateFile(file) {
  if (!file) return "Zgjidhni një skedar.";
  if (file.size === 0) return "Skedari është bosh.";
  if (!ALLOWED_EXTENSIONS.includes(fileExtension(file.name))) {
    return `Lloji i skedarit nuk lejohet. Lejohen: ${ALLOWED_EXTENSIONS.join(", ")}`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `Skedari është ${formatMegabytes(file.size)}MB — maksimumi është 50MB.`;
  }
  return "";
}

/** Field-by-field errors for a row, keyed by field name. Empty object = ready to send. */
export function validateRow(row, defaults) {
  const fields = effectiveFields(row, defaults);
  const errors = {};
  const fileError = validateFile(row.file);
  if (fileError) errors.file = fileError;

  const title = String(fields.title || "").trim();
  if (!title) errors.title = "Titulli është i detyrueshëm.";
  else if (title.length > 200) errors.title = "Titulli është shumë i gjatë.";
  else if (/[<>]/.test(title)) errors.title = "Titulli përmban karaktere të palejuara.";

  if (!fields.faculty) errors.faculty = "Zgjidhni fakultetin.";
  if (!fields.type) errors.type = "Zgjidhni llojin.";
  if (fields.type !== PRANUES) {
    const subject = String(fields.subject || "").trim();
    if (!subject) errors.subject = "Lënda është e detyrueshme.";
    else if (subject.length > 200 || /[<>]/.test(subject)) errors.subject = "Lënda nuk është e vlefshme.";
    for (const key of ["teacher", "department"]) {
      const value = String(fields[key] || "");
      if (value.length > 200 || /[<>]/.test(value)) errors[key] = "Vlera nuk është e vlefshme.";
    }
  }
  return errors;
}

/** The multipart body the Worker's upload action expects. */
export function buildFormData(row, defaults, contentHash) {
  const fields = effectiveFields(row, defaults);
  const form = new FormData();
  form.append("title", String(fields.title).trim());
  form.append("faculty", fields.faculty);
  form.append("department", String(fields.department || "").trim() || "//");
  form.append("subject", String(fields.subject || "").trim());
  form.append("teacher", String(fields.teacher || "").trim() || "//");
  form.append("type", fields.type);
  form.append("study_level", fields.study_level || "bachelor");
  form.append("is_anonymous", fields.is_anonymous ? "1" : "0");
  if (contentHash) form.append("content_hash", contentHash);
  form.append("file", row.file);
  return form;
}

/**
 * Which queued rows may start right now. Respects pausing, the concurrency cap
 * and the in-flight byte budget; a lone file larger than the budget still goes
 * once nothing else is running, so big files are never stuck forever.
 */
export function planUploads(rows, { paused = false } = {}) {
  if (paused) return [];
  const inFlight = rows.filter((row) => row.status === "uploading");
  let count = inFlight.length;
  let bytes = inFlight.reduce((sum, row) => sum + row.file.size, 0);
  const start = [];
  for (const row of rows) {
    if (row.status !== "queued") continue;
    if (count >= UPLOAD_CONCURRENCY) break;
    if (count > 0 && bytes + row.file.size > IN_FLIGHT_BYTE_BUDGET) continue;
    start.push(row.id);
    count += 1;
    bytes += row.file.size;
  }
  return start;
}

/** Counts per status plus a few derived totals, for the summary line. */
export function summarize(rows) {
  const counts = { ready: 0, queued: 0, uploading: 0, done: 0, failed: 0, skipped: 0 };
  for (const row of rows) counts[row.status] = (counts[row.status] || 0) + 1;
  return {
    ...counts,
    total: rows.length,
    finished: counts.done + counts.skipped,
    active: counts.queued + counts.uploading,
  };
}

/** SHA-256 of a file as lowercase hex. */
export async function sha256Hex(file) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** For each row, the earlier row in the batch with the same content (by hash). */
export function findBatchDuplicates(rows) {
  const firstByHash = new Map();
  const duplicateOf = new Map();
  for (const row of rows) {
    if (!row.hash) continue;
    if (firstByHash.has(row.hash)) duplicateOf.set(row.id, firstByHash.get(row.hash));
    else firstByHash.set(row.hash, row.id);
  }
  return duplicateOf;
}

/**
 * Chunks a list into groups no larger than `size`, so hash checks stay within
 * the Worker's per-request limit.
 */
export function chunk(items, size) {
  const groups = [];
  for (let i = 0; i < items.length; i += size) groups.push(items.slice(i, i + size));
  return groups;
}
