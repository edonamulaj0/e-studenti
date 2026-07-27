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

/**
 * Short label + color classes for a file-type badge.
 * Full literal Tailwind classes so the JIT compiler keeps them.
 */
export function getFileTypeBadge(fileType) {
  const ext = normalizeExtension(fileType, "");
  const label = ext ? ext.toUpperCase() : "FILE";

  if (ext === "pdf") return { label, className: "bg-red-100 text-red-600" };
  if (ext === "doc" || ext === "docx") {
    return { label, className: "bg-blue-100 text-blue-600" };
  }
  if (ext === "xls" || ext === "xlsx") {
    return { label, className: "bg-green-100 text-green-600" };
  }
  if (ext === "ppt" || ext === "pptx") {
    return { label, className: "bg-orange-100 text-orange-600" };
  }
  if (ext === "zip" || ext === "rar") {
    return { label, className: "bg-purple-200 text-purple-800" };
  }
  return { label, className: "bg-gray-100 text-gray-500" };
}
