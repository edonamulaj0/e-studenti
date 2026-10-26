"use client";

import { useEffect, useState } from "react";
import { AlertCircle, FileText, Folder, Loader2 } from "lucide-react";
import { formatFileSize } from "../lib/file-preview";
import { WORKER_URL } from "../lib/worker-url";
import { useT } from "./Preferences";

/** Files in a ZIP or RAR archive, without unpacking them. */
async function listArchive(buffer, fileType) {
  if (String(fileType || "").toLowerCase() === "rar") {
    const { listRarEntries } = await import("../lib/rar-listing");
    return listRarEntries(new Uint8Array(buffer))
      .filter((entry) => !entry.dir)
      .map((entry) => ({ path: entry.path, size: entry.size || 0 }));
  }
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(buffer);
  const files = [];
  zip.forEach((path, entry) => {
    if (!entry.dir) files.push({ path, size: entry._data?.uncompressedSize || 0 });
  });
  return files;
}

/** Inline, read-only listing of a ZIP's or RAR's files (folders shown as headings), loaded through the proxy. */
export default function ArchiveContents({ url, fileType = "zip", onCount }) {
  const t = useT();
  const [state, setState] = useState({ status: "loading", rows: [] });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${WORKER_URL}/?action=proxy&url=${encodeURIComponent(url)}`, { cache: "no-cache" });
        if (!res.ok) throw new Error(`fetch ${res.status}`);
        const files = await listArchive(await res.arrayBuffer(), fileType);
        files.sort((a, b) => a.path.localeCompare(b.path));
        if (cancelled) return;
        // Folder headings are inserted whenever the directory changes.
        const rows = [];
        let lastDir = "";
        for (const f of files) {
          const parts = f.path.split("/");
          const dir = parts.slice(0, -1).join("/");
          if (dir && dir !== lastDir) rows.push({ kind: "dir", name: `${dir}/`, depth: parts.length - 1 });
          lastDir = dir;
          rows.push({ kind: "file", name: parts[parts.length - 1], size: f.size, depth: parts.length - 1 });
        }
        setState({ status: "ready", rows });
        onCount?.(files.length);
      } catch {
        if (!cancelled) setState({ status: "error", rows: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, fileType, onCount]);

  if (state.status === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-600" role="status">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        {t("Duke ngarkuar përmbajtjen...")}
      </div>
    );
  }
  if (state.status === "error" || state.rows.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-600">
        <AlertCircle className="h-5 w-5" aria-hidden />
        {t("Arkivi është bosh ose nuk mund të lexohet.")}
      </div>
    );
  }
  return (
    <ul className="max-h-[32rem] divide-y divide-gray-100 overflow-y-auto text-sm">
      {state.rows.map((row, i) => (
        <li
          key={i}
          className="flex items-center justify-between gap-3 px-4 py-2.5"
          style={{ paddingLeft: `${1 + (row.kind === "file" ? row.depth : row.depth - 1) * 1.25}rem` }}
        >
          <span className={`flex min-w-0 items-center gap-2 ${row.kind === "dir" ? "font-bold text-navy-900" : "text-navy-800"}`}>
            {row.kind === "dir" ? (
              <Folder className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
            ) : (
              <FileText className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
            )}
            <span className="truncate">{row.name}</span>
          </span>
          {row.kind === "file" && <span className="shrink-0 text-xs text-gray-500">{formatFileSize(row.size)}</span>}
        </li>
      ))}
    </ul>
  );
}
