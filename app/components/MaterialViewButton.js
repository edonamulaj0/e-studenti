"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import MaterialPreviewModal from "./MaterialPreviewModal";
import { materialViewUrl } from "../lib/worker-url";
import { isArchiveType } from "../lib/file-preview";
import { trackMaterialView } from "../lib/track-material";

export default function MaterialViewButton({ material, className = "btn-primary flex-1" }) {
  const [open, setOpen] = useState(false);

  // Archives keep the existing redirect (their content viewer lives elsewhere).
  if (isArchiveType(material.fileType)) {
    return (
      <a
        href={materialViewUrl(material.id)}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        <Eye className="h-5 w-5" />
        Shiko materialin
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          trackMaterialView(material.id);
          setOpen(true);
        }}
        className={className}
      >
        <Eye className="h-5 w-5" />
        Shiko materialin
      </button>
      <MaterialPreviewModal
        isOpen={open}
        onClose={() => setOpen(false)}
        material={material}
      />
    </>
  );
}
