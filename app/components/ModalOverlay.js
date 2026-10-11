"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "../lib/use-focus-trap";

/**
 * Portal-mounted backdrop for dialogs. While open it:
 * - moves focus into the dialog (an element marked `data-autofocus`, else the
 *   first focusable one, else the dialog itself) and restores it on close;
 * - keeps Tab / Shift+Tab inside the dialog;
 * - closes on Escape;
 * - locks page scroll.
 * The dialog element itself (`role="dialog"`) is supplied by the caller.
 */
export default function ModalOverlay({
  open,
  onClose,
  children,
  align = "center",
  className = "",
}) {
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

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

  useFocusTrap(open && mounted, overlayRef, () => onCloseRef.current?.());

  if (!open || !mounted) return null;

  const alignClass =
    align === "bottom" ? "items-end sm:items-center" : "items-center";

  return createPortal(
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-[200] flex justify-center bg-ink/65 p-4 backdrop-blur-md ${alignClass} ${className}`}
      onClick={onClose}
      role="presentation"
    >
      {children}
    </div>,
    document.body
  );
}
