"use client";

import { useEffect, useState } from "react";
import { WORKER_URL } from "./worker-url";
import { prepareMaterial } from "./material-detail";

/**
 * Material pages are generated at build time, so one uploaded since then has no
 * page and lands here. If the address is /materialet/<slug>, ask the API for it
 * and show the detail view instead of the 404.
 */
export function useLateMaterial() {
  const [state, setState] = useState({ phase: "idle", material: null, slug: "" });

  useEffect(() => {
    const match = window.location.pathname.match(/^\/materialet\/([^/]+)\/?$/);
    if (!match) return undefined;
    let slug;
    try {
      slug = decodeURIComponent(match[1]);
    } catch {
      return undefined;
    }

    let cancelled = false;
    setState({ phase: "loading", material: null, slug });
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
    };
  }, []);

  return state;
}
