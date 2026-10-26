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
 * Whether a material can be opened in the browser. Every supported type can:
 * RAR archives, the last exception, are now listed from their headers
 * (lib/rar-listing.js) like ZIPs. Kept as the one place to decide it.
 */
export function hasInBrowserView() {
  return true;
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

/** `href` when it may be followed, otherwise undefined (React then renders no link target). */
export function safeHref(href) {
  return isSafeLinkHref(href) ? href : undefined;
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

/**
 * docx-preview copies style ids and font names out of the uploaded file into
 * <style> text without escaping them, so a crafted .docx can close its own
 * rule and style the rest of the site (hide the page, paint a fake login
 * notice, load tracking images). Every selector the renderer itself writes is
 * an optional tag name followed by a `.<className>…` class, so anything else
 * came from the file and is dropped, as are at-rules other than @font-face and
 * any url() that is not inline data.
 */
export function scopePreviewStyles(root, className) {
  if (!root?.querySelectorAll) return;
  const scoped = new RegExp(`^[a-z0-9]*\\.${className}[\\w-]*(?![\\w-])`, "i");
  const externalUrl = /url\(\s*(['"]?)(?!data:|blob:)/i;
  for (const style of root.querySelectorAll("style")) {
    let rules;
    try {
      rules = Array.from(style.sheet?.cssRules ?? []);
    } catch {
      rules = [];
    }
    const kept = rules.filter((rule) => {
      if (externalUrl.test(rule.cssText)) return false;
      if (rule instanceof CSSFontFaceRule) return true;
      if (!(rule instanceof CSSStyleRule)) return false;
      return rule.selectorText.split(",").every((part) => scoped.test(part.trim()));
    });
    style.textContent = kept.map((rule) => rule.cssText).join("\n");
  }
}

const SHEET_TAGS = new Set(["TABLE", "THEAD", "TBODY", "TFOOT", "TR", "TD", "TH"]);

/**
 * Rebuilds SheetJS's HTML output from an allowlist: table elements only, with
 * just numeric colspan/rowspan carried over and every cell's content reduced to
 * plain text. Nothing from the uploaded workbook (links, attributes, markup)
 * reaches the page as HTML. Returns a serialized string safe to inject.
 */
export function cleanSheetHtml(html) {
  const source = new DOMParser().parseFromString(String(html ?? ""), "text/html");
  const out = document.implementation.createHTMLDocument("");

  const copy = (node) => {
    const el = out.createElement(node.tagName.toLowerCase());
    if (node.tagName === "TD" || node.tagName === "TH") {
      for (const attr of ["colspan", "rowspan"]) {
        const value = Number.parseInt(node.getAttribute(attr) ?? "", 10);
        if (value > 1 && value <= 1000) el.setAttribute(attr, String(value));
      }
      el.textContent = node.textContent;
      return el;
    }
    for (const child of node.children) {
      if (SHEET_TAGS.has(child.tagName)) el.appendChild(copy(child));
    }
    return el;
  };

  const tables = Array.from(source.body.querySelectorAll("table")).map(copy);
  const holder = out.createElement("div");
  tables.forEach((table) => holder.appendChild(table));
  return holder.innerHTML;
}

/** 1536 -> "1.5 KB". Zero or missing sizes give an empty string. */
export function formatFileSize(bytes) {
  const n = Number(bytes);
  if (!n) return "";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  const value = n / 1024 ** i;
  return `${i === 0 ? value : value.toFixed(value < 10 ? 1 : 0).replace(/\.0$/, "")} ${units[i]}`;
}
