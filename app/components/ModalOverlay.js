"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/** Focusable descendants that are actually rendered (not display:none). */
function focusableIn(root) {
  return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => el.getClientRects().length > 0
  );
}

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

  const active = open && mounted;

  useEffect(() => {
    if (!active) return undefined;

    const overlay = overlayRef.current;
    if (!overlay) return undefined;
    const opener = document.activeElement;

    const getDialog = () => overlay.querySelector("[role='dialog']") || overlay;

    const dialog = getDialog();
    if (!dialog.hasAttribute("tabindex")) dialog.setAttribute("tabindex", "-1");
    const initial =
      dialog.querySelector("[data-autofocus]") || focusableIn(dialog)[0] || dialog;
    initial.focus({ preventScroll: true });

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;

      const box = getDialog();
      const items = focusableIn(box);
      if (items.length === 0) {
        event.preventDefault();
        box.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && (current === first || !box.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !box.contains(current))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      if (opener instanceof HTMLElement && document.contains(opener)) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [active]);

  if (!open || !mounted) return null;

  const alignClass =
    align === "bottom" ? "items-end sm:items-center" : "items-center";

  return createPortal(
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-[200] flex justify-center bg-navy-900/65 p-4 backdrop-blur-md ${alignClass} ${className}`}
      onClick={onClose}
      role="presentation"
    >
      {children}
    </div>,
    document.body
  );
}
