"use client";

import { Eye, Download } from "lucide-react";
import { formatStatCount } from "../lib/track-material";

export default function MaterialStatsBadge({
  viewCount = 0,
  downloadCount = 0,
  className = "",
}) {
  const views = Number(viewCount || 0);
  const downloads = Number(downloadCount || 0);
  if (views === 0 && downloads === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500 ${className}`}>
      {views > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-navy-100/70 px-2.5 py-1 text-navy-700">
          <Eye className="h-3.5 w-3.5" aria-hidden />
          {formatStatCount(views)}
        </span>
      )}
      {downloads > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-burgundy-50 px-2.5 py-1 text-burgundy-600">
          <Download className="h-3.5 w-3.5" aria-hidden />
          {formatStatCount(downloads)}
        </span>
      )}
    </div>
  );
}
