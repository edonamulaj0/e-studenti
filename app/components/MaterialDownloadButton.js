"use client";

import { Download } from "lucide-react";
import TrackableDownloadLink from "./TrackableDownloadLink";
import { useT } from "./Preferences";

export default function MaterialDownloadButton({ materialId, href, fileName }) {
  const t = useT();
  return (
    <TrackableDownloadLink
      materialId={materialId}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      download={fileName}
      className="btn-secondary flex-1"
    >
      <Download className="h-5 w-5" />
      {t("Shkarko")}
    </TrackableDownloadLink>
  );
}
