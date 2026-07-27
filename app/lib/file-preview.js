const ARCHIVE_TYPES = new Set(["zip", "rar"]);

export function normalizeExtension(fileType, fallback = "") {
  return String(fileType || fallback || "")
    .toLowerCase()
    .trim()
    .replace(/^\./, "");
}

/**
 * Classify a file type for in-browser rendering.
 * - pdf:   native browser viewer (iframe)
 * - docx:  docx-preview
 * - sheet: SheetJS (xls + xlsx)
 * - pptx:  @aiden0z/pptx-renderer
 * - archive: zip/rar (handled by ArchiveModal)
 * - unsupported: legacy binary .doc/.ppt and anything else
 */
export function getPreviewKind(fileType) {
  const ext = normalizeExtension(fileType, "pdf");
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  if (ext === "xlsx" || ext === "xls") return "sheet";
  if (ext === "pptx") return "pptx";
  if (ARCHIVE_TYPES.has(ext)) return "archive";
  return "unsupported";
}

export function isArchiveType(fileType) {
  return getPreviewKind(fileType) === "archive";
}

/** True for types the preview modal can render inline. */
export function isPreviewable(fileType) {
  return ["pdf", "docx", "sheet", "pptx"].includes(getPreviewKind(fileType));
}
