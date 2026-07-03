"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function ModalOverlay({
  open,
  onClose,
  children,
  align = "center",
  className = "",
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || !mounted) return null;

  const alignClass =
    align === "bottom" ? "items-end sm:items-center" : "items-center";

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] flex justify-center bg-navy-900/65 p-4 backdrop-blur-md ${alignClass} ${className}`}
      onClick={onClose}
      role="presentation"
    >
      {children}
    </div>,
    document.body
  );
}
