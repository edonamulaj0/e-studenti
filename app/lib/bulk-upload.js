import { WORKER_URL } from "./worker-url";

/** Must stay in sync with the worker (ALLOWED_EXTENSIONS, MAX_FILE_SIZE, MAX_BATCH_FILES). */
export const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "zip"];
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const MAX_BATCH_FILES = 200;
/** Parallel uploads. More than this and mobile connections start timing out mid-batch. */
export const UPLOAD_CONCURRENCY = 3;

/**
 * Files an operating system puts in a folder that nobody meant to upload.
 * Dropped silently rather than shown as errors — a folder of forty lectures
 * that reports "41 files, 1 unsupported" for a .DS_Store is just noise.
 */
const JUNK_FILES = /^(\.DS_Store|Thumbs\.db|desktop\.ini|\.localized|Icon\r?)$/i;
const JUNK_PATHS = /(^|\/)(__MACOSX|\.git|\.svn|node_modules)(\/|$)/i;

function isJunk(name, relativePath) {
  const base = name.split("/").pop() || "";
  if (JUNK_FILES.test(base)) return true;
  if (base.startsWith("._")) return true;
  if (JUNK_PATHS.test(relativePath || "")) return true;
  return false;
}

export function extensionOf(filename) {
  return String(filename || "").split(".").pop()?.toLowerCase() || "";
}

export function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")}MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

/**
 * A readable title from a filename: extension gone, separators turned into
 * spaces, runs collapsed. A suggestion the user is expected to correct, not an
 * attempt at being clever — "Ligjerata-07_v2.pdf" becomes "Ligjerata 07 v2".
 */
export function titleFromFilename(filename) {
  const base = (filename.split("/").pop() || filename).replace(/\.[^.]+$/, "");
  const cleaned = base.replace(/[-_.]+/g, " ").replace(/\s+/g, " ").trim();
  return cleaned || base || "Material";
}

/** Local check, so a bad file is flagged on selection rather than after a doomed upload. */
export function validateLocalFile(file) {
  if (file.size === 0) return "Skedari është bosh.";
  if (file.size > MAX_FILE_SIZE) {
    return `${formatBytes(file.size)} — kufiri për një skedar është 50MB.`;
  }
  const ext = extensionOf(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Lloji .${ext || "?"} nuk lejohet.`;
  }
  return "";
}

/**
 * Drains a directory reader.
 *
 * readEntries returns at most 100 entries per call and signals the end with an
 * empty batch, so a single call silently truncates any folder larger than that
 * — the classic folder-upload bug.
 */
function readAllEntries(reader) {
  return new Promise((resolve, reject) => {
    const entries = [];
    const readBatch = () => {
      reader.readEntries((batch) => {
        if (!batch.length) {
          resolve(entries);
          return;
        }
        entries.push(...batch);
        readBatch();
      }, reject);
    };
    readBatch();
  });
}

async function walkEntry(entry, prefix, out) {
  if (entry.isFile) {
    const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
    out.push({ file, relativePath: `${prefix}${file.name}` });
    return;
  }
  if (entry.isDirectory) {
    const children = await readAllEntries(entry.createReader());
    for (const child of children) {
      await walkEntry(child, `${prefix}${entry.name}/`, out);
    }
  }
}

/**
 * Files from a drop, including whole folders.
 *
 * Falls back to the flat file list when the browser has no entry API — that is
 * most mobile browsers, where folders cannot be dropped at all.
 */
export async function filesFromDrop(dataTransfer) {
  const items = [...(dataTransfer.items || [])];
  const canWalk = items.length > 0 && typeof items[0].webkitGetAsEntry === "function";

  if (!canWalk) {
    return [...(dataTransfer.files || [])].map((file) => ({ file, relativePath: file.name }));
  }

  const entries = items.map((item) => item.webkitGetAsEntry()).filter(Boolean);
  const collected = [];
  for (const entry of entries) {
    await walkEntry(entry, "", collected);
  }
  return collected;
}

/** Files from an <input>, using webkitRelativePath when a folder was picked. */
export function filesFromInput(fileList) {
  return [...(fileList || [])].map((file) => ({
    file,
    relativePath: file.webkitRelativePath || file.name,
  }));
}

/** Drops OS clutter and turns the rest into rows the grid can render. */
export function toUploadRows(collected) {
  return collected
    .filter(({ file, relativePath }) => !isJunk(file.name, relativePath))
    .map(({ file, relativePath }, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      file,
      relativePath,
      folder: relativePath.includes("/") ? relativePath.split("/").slice(0, -1).join("/") : "",
      title: titleFromFilename(file.name),
      type: "",
      status: validateLocalFile(file) ? "invalid" : "queued",
      error: validateLocalFile(file),
      progress: 0,
      key: "",
    }));
}

/**
 * PUTs one file straight to R2.
 *
 * XMLHttpRequest rather than fetch, for real upload progress. Content-Length is
 * signed by the worker but deliberately not set here: browsers forbid setting
 * it, and set it themselves from the body — which is exactly the check, since a
 * file of any other size produces a Content-Length the signature does not cover.
 */
export function putToPresignedUrl(file, url, onProgress, registerAbort) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    registerAbort?.(() => xhr.abort());
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Ngarkimi dështoi (kodi ${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Lidhja u ndërpre gjatë ngarkimit."));
    xhr.ontimeout = () => reject(new Error("Lidhja u ndërpre gjatë ngarkimit."));
    xhr.onabort = () => reject(new Error("Ngarkimi u ndërpre."));
    xhr.send(file);
  });
}

/** Runs tasks with a ceiling on how many are in flight at once. */
export async function runWithConcurrency(items, limit, task) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      await task(items[index], index);
    }
  });
  await Promise.all(workers);
}

async function postJson(action, body) {
  const res = await fetch(`${WORKER_URL}/?action=${action}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Kërkesa dështoi (kodi ${res.status}).`);
  }
  return data;
}

export function requestUploadUrls({ collection, files }) {
  return postJson("bulk-upload-init", { collection, files });
}

export function commitUploads(files) {
  return postJson("bulk-upload-commit", { files });
}
