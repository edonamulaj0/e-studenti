"use client";

import { materialDownloadUrl } from "../lib/worker-url";

export default function TrackableDownloadLink({
  materialId,
  href,
  className,
  children,
  download,
  onClick,
  ...rest
}) {
  const trackedHref = materialId ? materialDownloadUrl(materialId) : href;

  return (
    <a
      href={trackedHref}
      className={className}
      download={download}
      onClick={onClick}
      {...rest}
    >
      {children}
    </a>
  );
}
