"use client";

import { useState } from "react";
import MaterialCard from "./MaterialCard";
import ArchiveModal from "./ArchiveModal";
import MaterialPreviewModal from "./MaterialPreviewModal";
import { trackMaterialView } from "../lib/track-material";

/** A grid of compact cards that share one preview modal and one archive modal. */
export default function MaterialGrid({ materials, showSubject = true, className = "" }) {
  const [selected, setSelected] = useState(null);
  const [kind, setKind] = useState(null);

  const open = (material) => {
    trackMaterialView(material.id);
    setSelected(material);
    setKind(material.fileType?.toLowerCase() === "zip" ? "archive" : "preview");
  };
  const close = () => setKind(null);

  return (
    <>
      <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 ${className}`}>
        {materials.map((m) => (
          <MaterialCard key={m.id} material={m} onView={open} showSubject={showSubject} />
        ))}
      </div>
      <ArchiveModal isOpen={kind === "archive"} onClose={close} material={selected} />
      <MaterialPreviewModal isOpen={kind === "preview"} onClose={close} material={selected} />
    </>
  );
}
