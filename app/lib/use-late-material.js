"use client";

import { useEffect, useState } from "react";
import { WORKER_URL } from "./worker-url";
import { prepareMaterial } from "./material-detail";

/**
 * Material pages are generated at build time, so one uploaded since then has no
 * page and lands here. If the address is /materialet/<slug> (or /lenda/<slug> for a
 * subject), ask the API for it and show the page instead of the 404.
 */
const LOAD_TIMEOUT_MS = 8000;

export function useLateMaterial() {
  // "checking" is also what the prerendered 404.html contains, so nothing
  // misleading is painted before we know whether this address is a material.
  const [state, setState] = useState({ phase: "checking", material: null, subject: null, slug: "" });

  useEffect(() => {
    const match = window.location.pathname.match(/^\/(materialet|lenda)\/([^/]+)\/?$/);
    const isSubject = match?.[1] === "lenda";
    let slug = "";
    if (match) {
      try {
        slug = decodeURIComponent(match[2]);
      } catch {
        slug = "";
      }
    }
    if (!slug) {
      setState({ phase: "idle", material: null, subject: null, slug: "" });
      return undefined;
    }

    let cancelled = false;
    setState({ phase: "loading", material: null, subject: null, slug });
    // Never leave the skeleton up indefinitely if the API hangs.
    const giveUp = setTimeout(() => {
      if (!cancelled) setState({ phase: "idle", material: null, subject: null, slug });
    }, LOAD_TIMEOUT_MS);
    const action = isSubject ? "subject-public" : "material-public";
    fetch(`${WORKER_URL}/?action=${action}&slug=${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (isSubject && data?.subject) {
          setState({ phase: "found", material: null, subject: data, slug });
        } else if (!isSubject && data?.material) {
          setState({ phase: "found", material: prepareMaterial(data.material, slug), subject: null, slug });
        } else {
          setState({ phase: "idle", material: null, subject: null, slug });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ phase: "idle", material: null, subject: null, slug });
      });
    return () => {
      cancelled = true;
      clearTimeout(giveUp);
    };
  }, []);

  return state;
}
