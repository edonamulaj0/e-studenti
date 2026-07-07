"use client";

import { useEffect } from "react";
import { trackMaterialView } from "../lib/track-material";

export default function MaterialViewTracker({ materialId }) {
  useEffect(() => {
    if (!materialId) return;
    const timeout = window.setTimeout(() => {
      trackMaterialView(materialId);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [materialId]);

  return null;
}
