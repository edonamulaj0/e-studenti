"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

/** Pixels above and below the viewport kept rasterised, so scrolling stays ahead. */
const OVERSCAN_PX = 600;
/**
 * Cap on devicePixelRatio. A 3x phone screen rasterising a full-width A4 page
 * produces roughly 24 megapixels of canvas per page, which is enough to have
 * the tab killed on a mid-range Android device. 2x is indistinguishable here.
 */
const MAX_PIXEL_RATIO = 2;
/** A4 portrait (width / height), used to size placeholders before page 1 loads. */
const DEFAULT_ASPECT = 1 / 1.414;

let pdfjsPromise = null;

/**
 * pdf.js, loaded once and only when a PDF is actually opened.
 *
 * The legacy build is deliberate. The modern build calls
 * Promise.withResolvers(), which Safari only gained in 17.4 — and the browsers
 * this viewer exists to serve are precisely the older mobile ones. The legacy
 * bundle ships the core-js polyfill for it.
 */
function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist/legacy/build/pdf.mjs").then((pdfjs) => {
      // Same-origin worker asset emitted by the bundler, which satisfies the
      // site's `worker-src 'self' blob:` policy.
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

/**
 * Renders a PDF into per-page canvases.
 *
 * This replaces an <iframe> pointed at a blob: URL, which only ever worked
 * where the browser ships an embedded PDF plugin. Chrome on Android has none
 * and left the frame blank; iOS Safari painted the first page and ignored
 * scrolling. Neither raises an error, so the modal reported a successful load
 * over an empty white rectangle. Canvas rendering behaves identically on every
 * browser, and pages outside the viewport are freed so long documents stay
 * within a phone's memory budget.
 */
export default function PdfCanvasViewer({ url, title }) {
  const scrollRef = useRef(null);
  const hostsRef = useRef([]);
  const pagesRef = useRef([]);
  const docRef = useRef(null);
  const [pageCount, setPageCount] = useState(0);
  const [aspect, setAspect] = useState(DEFAULT_ASPECT);
  const [status, setStatus] = useState("loading");

  const renderPage = useCallback(async (index) => {
    const doc = docRef.current;
    const host = hostsRef.current[index];
    if (!doc || !host) return;

    const canvas = host.querySelector("canvas");
    const targetWidth = host.clientWidth;
    if (!canvas || !targetWidth) return;

    const entry = pagesRef.current[index] || (pagesRef.current[index] = {});
    // Already drawn at this width; a resize changes the width and re-renders.
    if (entry.rendered && entry.width === targetWidth) return;

    entry.task?.cancel();
    entry.task = null;
    entry.rendered = true;
    entry.width = targetWidth;

    try {
      const page = await doc.getPage(index + 1);
      if (docRef.current !== doc) return;

      const base = page.getViewport({ scale: 1 });
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      const viewport = page.getViewport({ scale: (targetWidth / base.width) * ratio });

      // Pages in one document can differ in size, so the placeholder is
      // corrected to this page's real shape as it is drawn.
      host.style.aspectRatio = `${base.width} / ${base.height}`;
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));

      const task = page.render({ canvasContext: canvas.getContext("2d"), viewport });
      entry.task = task;
      await task.promise;
      entry.task = null;
    } catch (error) {
      entry.task = null;
      // A cancelled render is the expected outcome of scrolling away mid-draw.
      if (error?.name !== "RenderingCancelledException") {
        entry.rendered = false;
        entry.width = 0;
      }
    }
  }, []);

  const freePage = useCallback((index) => {
    const entry = pagesRef.current[index];
    const host = hostsRef.current[index];
    if (!entry?.rendered || !host) return;

    entry.task?.cancel();
    entry.task = null;
    entry.rendered = false;
    entry.width = 0;

    // Zeroing the dimensions releases the backing bitmap. The placeholder keeps
    // its height from aspect-ratio, so the scroll position does not jump.
    const canvas = host.querySelector("canvas");
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }, []);

  const syncPages = useCallback(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const top = scroller.scrollTop - OVERSCAN_PX;
    const bottom = scroller.scrollTop + scroller.clientHeight + OVERSCAN_PX;

    hostsRef.current.forEach((host, index) => {
      if (!host) return;
      const start = host.offsetTop;
      const end = start + host.offsetHeight;
      if (end >= top && start <= bottom) renderPage(index);
      else freePage(index);
    });
  }, [renderPage, freePage]);

  useEffect(() => {
    if (!url) return undefined;

    let cancelled = false;
    setStatus("loading");
    setPageCount(0);
    hostsRef.current = [];
    pagesRef.current = [];

    (async () => {
      try {
        const pdfjs = await loadPdfjs();
        if (cancelled) return;

        // Fetched through the worker proxy, same as every other preview kind.
        const res = await fetch(url, { cache: "no-cache" });
        if (!res.ok) throw new Error(`fetch ${res.status}`);
        const data = await res.arrayBuffer();
        if (cancelled) return;
        if (!data.byteLength) throw new Error("empty file");

        // isEvalSupported keeps pdf.js away from `new Function`, which the
        // site's script-src policy would block.
        const doc = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;
        if (cancelled) {
          doc.destroy();
          return;
        }
        docRef.current = doc;

        const first = await doc.getPage(1);
        const viewport = first.getViewport({ scale: 1 });
        if (cancelled) return;

        setAspect(viewport.width / viewport.height);
        hostsRef.current = new Array(doc.numPages).fill(null);
        pagesRef.current = new Array(doc.numPages).fill(null);
        setPageCount(doc.numPages);
        setStatus("ready");
      } catch (error) {
        console.error("PDF render error:", error);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      pagesRef.current.forEach((entry) => entry?.task?.cancel());
      pagesRef.current = [];
      hostsRef.current = [];
      const doc = docRef.current;
      docRef.current = null;
      doc?.destroy();
    };
  }, [url]);

  // Draw what is on screen, and keep up with scrolling and width changes.
  useEffect(() => {
    if (!pageCount) return undefined;
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        syncPages();
      });
    };

    scroller.addEventListener("scroll", schedule, { passive: true });
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    observer?.observe(scroller);
    syncPages();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", schedule);
      observer?.disconnect();
    };
  }, [pageCount, syncPages]);

  return (
    <div className="relative h-full w-full">
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-srh-paper">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-srh-crimson" />
          <p className="text-srh-navy/70">Duke ngarkuar parapamjen...</p>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-srh-paper p-8 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-srh-crimson" />
          <p className="max-w-md text-srh-navy/70">
            Nuk mund të shfaqet parapamja e këtij skedari. Provoni ta hapni në skedë
            të re ose ta shkarkoni.
          </p>
        </div>
      )}

      <div
        ref={scrollRef}
        className="relative h-full w-full overflow-y-auto overflow-x-hidden bg-srh-paper"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-2 sm:gap-4 sm:p-4">
          {Array.from({ length: pageCount }, (_, index) => (
            <div
              key={index}
              ref={(el) => {
                hostsRef.current[index] = el;
              }}
              className="w-full bg-white shadow-sm"
              style={{ aspectRatio: String(aspect) }}
            >
              <canvas
                className="block h-full w-full"
                aria-label={`${title || "Dokument"} — faqja ${index + 1}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
