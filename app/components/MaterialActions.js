"use client";

import { Archive, Download, Eye } from "lucide-react";
import TrackableDownloadLink from "./TrackableDownloadLink";
import { materialDownloadUrl, materialViewUrl } from "../lib/worker-url";
import { hasInBrowserView } from "../lib/file-preview";
import { useT } from "./Preferences";

/** Preview (or Contents, for archives) button plus the icon-only download button. */
export default function MaterialActions({ material, onView }) {
  const t = useT();
  const isArchive = material.fileType?.toLowerCase() === "zip";
  const canView = Boolean(material.r2Url) && hasInBrowserView(material.fileType);
  return (
    <div className="flex items-center gap-2">
      {canView &&
        (isArchive ? (
          <button type="button" onClick={() => onView?.(material)} className="btn-outline min-h-[38px] px-3.5 py-1.5 text-sm">
            <Archive className="h-4 w-4" aria-hidden />
            {t("Përmbajtja")}
          </button>
        ) : (
          <a
            href={materialViewUrl(material.id)}
            onClick={(e) => {
              e.preventDefault();
              onView?.(material);
            }}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline min-h-[38px] px-3.5 py-1.5 text-sm"
          >
            <Eye className="h-4 w-4" aria-hidden />
            {t("Shiko")}
          </a>
        ))}
      {material.r2Url && (
        <TrackableDownloadLink
          materialId={material.id}
          href={materialDownloadUrl(material.id)}
          target="_blank"
          rel="noopener noreferrer"
          download={material.title.replace(/[^a-z0-9]/gi, "_") + "." + (material.fileType || "pdf")}
          className="btn-secondary min-h-[38px] w-[38px] px-0 py-0"
          aria-label={t("Shkarko")}
          title={t("Shkarko")}
        >
          <Download className="h-4 w-4" aria-hidden />
        </TrackableDownloadLink>
      )}
    </div>
  );
}
