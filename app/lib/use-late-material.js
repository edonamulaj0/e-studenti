"use client";

import { useEffect, useState } from "react";
import { WORKER_URL } from "./worker-url";
import { prepareMaterial } from "./material-detail";

/**
 * Material pages are generated at build time, so one uploaded since then has no
 * page and lands here. If the address is /materialet/<slug>, ask the API for it
 * and show the detail view instead of the 404.
 */
const LOAD_TIMEOUT_MS = 8000;

export function useLateMaterial() {
  // "checking" is also what the prerendered 404.html contains, so nothing
  // misleading is painted before we know whether this address is a material.
  const [state, setState] = useState({ phase: "checking", material: null, slug: "" });

  useEffect(() => {
    const match = window.location.pathname.match(/^\/materialet\/([^/]+)\/?$/);
    let slug = "";
    if (match) {
      try {
        slug = decodeURIComponent(match[1]);
      } catch {
        slug = "";
      }
    }
    if (!slug) {
      setState({ phase: "idle", material: null, slug: "" });
      return undefined;
    }

    let cancelled = false;
    setState({ phase: "loading", material: null, slug });
    // Never leave the skeleton up indefinitely if the API hangs.
    const giveUp = setTimeout(() => {
      if (!cancelled) setState({ phase: "idle", material: null, slug });
    }, LOAD_TIMEOUT_MS);
    fetch(`${WORKER_URL}/?action=material-public&slug=${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setState(
          data?.material
            ? { phase: "found", material: prepareMaterial(data.material, slug), slug }
            : { phase: "idle", material: null, slug }
        );
      })
      .catch(() => {
        if (!cancelled) setState({ phase: "idle", material: null, slug });
      });
    return () => {
      cancelled = true;
      clearTimeout(giveUp);
    };
  }, []);

  return state;
}
