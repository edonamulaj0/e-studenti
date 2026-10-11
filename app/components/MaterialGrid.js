"use client";

import { useState } from "react";
import MaterialCard from "./MaterialCard";
import MaterialRow from "./MaterialRow";
import ArchiveModal from "./ArchiveModal";
import MaterialPreviewModal from "./MaterialPreviewModal";
import { trackMaterialView } from "../lib/track-material";

/** A grid of compact cards that share one preview modal and one archive modal. */
export default function MaterialGrid({ materials, showSubject = true, view = "grid", className = "", columns = "sm:grid-cols-2 xl:grid-cols-3" }) {
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
      {view === "list" ? (
        <ul className={`divide-y divide-gray-100 rounded-2xl border border-gray-200/80 bg-surface shadow-sm ${className}`}>
          {materials.map((m) => (
            <MaterialRow key={m.id} material={m} onView={open} showSubject={showSubject} />
          ))}
        </ul>
      ) : (
        <div className={`grid grid-cols-1 gap-3 ${columns} ${className}`}>
          {materials.map((m) => (
            <MaterialCard key={m.id} material={m} onView={open} showSubject={showSubject} />
          ))}
        </div>
      )}
      <ArchiveModal isOpen={kind === "archive"} onClose={close} material={selected} />
      <MaterialPreviewModal isOpen={kind === "preview"} onClose={close} material={selected} />
    </>
  );
}
