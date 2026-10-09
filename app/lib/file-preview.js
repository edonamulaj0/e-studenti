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

/**
 * False for types with no in-browser view at all. RAR is the only one: no
 * renderer handles it and the archive modal cannot list its entries, so those
 * materials are offered as a download only.
 */
export function hasInBrowserView(fileType) {
  return normalizeExtension(fileType, "") !== "rar";
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

const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * True when a hyperlink found inside an uploaded document may be followed.
 * Preview renderers copy link targets out of user-supplied files verbatim, and
 * a `javascript:` target would run on this origin. Same-document anchors are
 * harmless; everything else must use an allowlisted protocol.
 */
export function isSafeLinkHref(href) {
  const value = String(href ?? "").trim();
  if (!value) return false;
  if (value.startsWith("#")) return true;
  try {
    return SAFE_LINK_PROTOCOLS.has(new URL(value, "https://e-studenti.com").protocol);
  } catch {
    return false;
  }
}

/**
 * Strips unsafe link targets from rendered preview content and forces external
 * links to open in a new, isolated tab. Content that mounts later (windowed
 * slides) is covered by the click guard, not by this pass.
 */
export function sanitizePreviewLinks(root) {
  if (!root?.querySelectorAll) return;
  for (const anchor of root.querySelectorAll("a")) {
    const href = anchor.getAttribute("href");
    if (!isSafeLinkHref(href)) {
      anchor.removeAttribute("href");
      anchor.removeAttribute("xlink:href");
      continue;
    }
    if (!href.trim().startsWith("#")) {
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer nofollow ugc");
    }
  }
}

/** Capture-phase click handler that blocks navigation to unsafe link targets. */
export function blockUnsafeLinkClick(event) {
  const anchor = event.target?.closest?.("a");
  if (!anchor) return;
  const href = anchor.getAttribute("href") ?? anchor.getAttribute("xlink:href");
  if (href !== null && !isSafeLinkHref(href)) {
    event.preventDefault();
    event.stopPropagation();
  }
}
