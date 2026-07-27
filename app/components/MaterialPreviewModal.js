"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";
import ModalOverlay from "./ModalOverlay";
import { WORKER_URL, materialDownloadUrl } from "../lib/worker-url";
import { getPreviewKind } from "../lib/file-preview";

function proxyUrl(fileUrl) {
  return `${WORKER_URL}/?action=proxy&url=${encodeURIComponent(fileUrl)}`;
}

export default function MaterialPreviewModal({ isOpen, onClose, material }) {
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error | unsupported
  const [sheetNames, setSheetNames] = useState([]);
  const [activeSheet, setActiveSheet] = useState("");
  const [sheetHtml, setSheetHtml] = useState("");

  const containerRef = useRef(null);
  const workbookRef = useRef(null);
  const xlsxRef = useRef(null);

  const kind = material ? getPreviewKind(material.fileType) : "unsupported";
  const fileUrl = material?.r2Url || "";
  const downloadHref = material?.id ? materialDownloadUrl(material.id) : fileUrl;

  useEffect(() => {
    if (!isOpen || !material || !fileUrl) return undefined;

    let cancelled = false;
    setSheetNames([]);
    setActiveSheet("");
    setSheetHtml("");
    workbookRef.current = null;

    if (kind === "pdf") {
      setStatus("ready");
      return undefined;
    }
    if (kind === "unsupported" || kind === "archive") {
      setStatus("unsupported");
      return undefined;
    }

    setStatus("loading");

    (async () => {
      try {
        const res = await fetch(proxyUrl(fileUrl), { cache: "no-cache" });
        if (!res.ok) throw new Error(`fetch ${res.status}`);
        const buffer = await res.arrayBuffer();
        if (cancelled) return;
        if (!buffer || buffer.byteLength === 0) throw new Error("empty file");

        if (kind === "docx") {
          const docx = await import("docx-preview");
          if (cancelled || !containerRef.current) return;
          containerRef.current.innerHTML = "";
          await docx.renderAsync(buffer, containerRef.current, undefined, {
            className: "docx",
            inWrapper: true,
            breakPages: true,
            ignoreLastRenderedPageBreak: false,
          });
        } else if (kind === "sheet") {
          const XLSX = await import("xlsx");
          if (cancelled) return;
          const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });
          xlsxRef.current = XLSX;
          workbookRef.current = wb;
          const names = wb.SheetNames || [];
          setSheetNames(names);
          setActiveSheet(names[0] || "");
        } else if (kind === "pptx") {
          const { PptxViewer } = await import("@aiden0z/pptx-renderer/browser");
          if (cancelled || !containerRef.current) return;
          containerRef.current.innerHTML = "";
          await PptxViewer.open(buffer, containerRef.current, {
            listOptions: { windowed: true },
          });
        }

        if (!cancelled) setStatus("ready");
      } catch (err) {
        console.error("Preview render error:", err);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, material?.id, kind, fileUrl]);

  // Re-render the active spreadsheet sheet as an HTML table.
  useEffect(() => {
    if (kind !== "sheet" || !activeSheet || !workbookRef.current || !xlsxRef.current) {
      return;
    }
    const sheet = workbookRef.current.Sheets[activeSheet];
    if (sheet) {
      setSheetHtml(xlsxRef.current.utils.sheet_to_html(sheet));
    }
  }, [activeSheet, kind]);

  if (!isOpen || !material) return null;

  const showSpinner = status === "loading";

  return (
    <ModalOverlay open={isOpen} onClose={onClose} className="!p-0 sm:!p-4">
      <div
        className="preview-modal-height flex w-full max-w-[1600px] flex-col overflow-hidden border border-srh-cream bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-srh-cream px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="truncate font-playfair text-lg font-bold text-srh-navy sm:text-xl">
              {material.title}
            </h2>
            <p className="mt-0.5 text-xs text-srh-navy/60">
              {material.fileType?.toUpperCase() || "PDF"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-2 text-srh-navy/70 transition-colors hover:bg-srh-blush/20 hover:text-srh-navy"
              title="Hap në skedë të re"
              aria-label="Hap në skedë të re"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
            <a
              href={downloadHref}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="rounded-lg p-2 text-srh-navy/70 transition-colors hover:bg-srh-blush/20 hover:text-srh-navy"
              title="Shkarko"
              aria-label="Shkarko"
            >
              <Download className="h-5 w-5" />
            </a>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-srh-navy/70 transition-colors hover:bg-srh-blush/20 hover:text-srh-navy"
              title="Mbyll"
              aria-label="Mbyll"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="relative flex-1 overflow-hidden bg-srh-paper">
          {showSpinner && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-srh-paper">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-srh-crimson" />
              <p className="text-srh-navy/70">Duke ngarkuar parapamjen...</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <AlertCircle className="mb-4 h-12 w-12 text-srh-crimson" />
              <p className="max-w-md text-srh-navy/70">
                Nuk mund të shfaqet parapamja e këtij skedari. Provoni ta hapni në
                skedë të re ose ta shkarkoni.
              </p>
            </div>
          )}

          {status === "unsupported" && (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <FileText className="mb-4 h-12 w-12 text-srh-navy/40" />
              <p className="max-w-md text-srh-navy/70">
                Ky format skedari nuk mund të shfaqet online. Ju lutemi hapeni në
                skedë të re ose shkarkojeni për ta parë.
              </p>
            </div>
          )}

          {/* PDF: native browser viewer */}
          {kind === "pdf" && (
            <iframe
              key={fileUrl}
              src={fileUrl}
              title={material.title}
              className="h-full w-full border-0"
            />
          )}

          {/* DOCX / PPTX: rendered imperatively into this container */}
          {(kind === "docx" || kind === "pptx") && (
            <div className="h-full w-full overflow-auto">
              <div ref={containerRef} className="mx-auto min-h-full w-full" />
            </div>
          )}

          {/* Spreadsheets: sheet tabs + HTML table */}
          {kind === "sheet" && status === "ready" && (
            <div className="flex h-full flex-col">
              {sheetNames.length > 1 && (
                <div className="flex flex-wrap gap-1 border-b border-srh-cream bg-white px-3 py-2">
                  {sheetNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setActiveSheet(name)}
                      className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                        name === activeSheet
                          ? "bg-srh-crimson text-white"
                          : "text-srh-navy/70 hover:bg-srh-blush/20"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
              <div
                className="sheet-preview flex-1 overflow-auto bg-white p-4"
                dangerouslySetInnerHTML={{ __html: sheetHtml }}
              />
            </div>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
}
