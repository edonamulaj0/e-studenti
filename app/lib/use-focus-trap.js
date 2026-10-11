"use client";

import { useEffect, useRef } from "react";

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
 * While `active`, keeps keyboard focus inside the `[role="dialog"]` found in
 * `containerRef` (or the container itself):
 * - moves focus in on open (an element marked `data-autofocus`, else the first
 *   focusable one, else the dialog itself) and restores it to the opener on close;
 * - wraps Tab / Shift+Tab at the ends;
 * - calls `onEscape` on Escape.
 */
export function useFocusTrap(active, containerRef, onEscape) {
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!active) return undefined;

    const container = containerRef.current;
    if (!container) return undefined;
    const opener = document.activeElement;

    const getDialog = () => container.querySelector("[role='dialog']") || container;

    const dialog = getDialog();
    if (!dialog.hasAttribute("tabindex")) dialog.setAttribute("tabindex", "-1");
    const initial =
      dialog.querySelector("[data-autofocus]") || focusableIn(dialog)[0] || dialog;
    initial.focus({ preventScroll: true });

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onEscapeRef.current?.();
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
  }, [active, containerRef]);
}
