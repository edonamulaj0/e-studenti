"use client";

import { trackMaterialDownload } from "../lib/track-material";

export default function TrackableDownloadLink({
  materialId,
  href,
  className,
  children,
  download,
  onClick,
  ...rest
}) {
  const handleClick = (event) => {
    if (materialId) trackMaterialDownload(materialId);
    onClick?.(event);
  };

  return (
    <a
      href={href}
      className={className}
      download={download}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </a>
  );
}
