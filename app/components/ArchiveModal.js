"use client";

import { useState, useEffect } from "react";
import {
  X,
  FileText,
  Folder,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react";
import JSZip from "jszip";
import { WORKER_URL, materialDownloadUrl } from "../lib/worker-url";
import ModalOverlay from "./ModalOverlay";
import { useT } from "./Preferences";

/** Most a single archive entry may inflate to in the browser. */
const MAX_ENTRY_BYTES = 50 * 1024 * 1024;

/**
 * Inflates one ZIP entry, giving up once it exceeds `limit`. The sizes listed in
 * an archive are declared by whoever made it and are not trusted, so a small
 * entry that expands enormously is stopped here instead of exhausting memory.
 */
function inflateCapped(zipFile, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    const stream = zipFile.internalStream("uint8array");
    stream
      .on("data", (chunk) => {
        total += chunk.length;
        if (total > limit) {
          stream.pause();
          chunks.length = 0;
          reject(new Error("entry-too-large"));
          return;
        }
        chunks.push(chunk);
      })
      .on("error", reject)
      .on("end", () => resolve(new Blob(chunks)));
    stream.resume();
  });
}

export default function ArchiveModal({ isOpen, onClose, material }) {
  const t = useT();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zipObject, setZipObject] = useState(null);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    if (isOpen && material) {
      loadArchiveContents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the modal opens or the material changes; the loaders are recreated each render
  }, [isOpen, material]);

  const loadArchiveContents = async () => {
    setLoading(true);
    setError(null);
    setFiles([]);
    setZipObject(null);
    setDownloadError("");

    try {
      const fileType = material.fileType?.toLowerCase();

      if (fileType === "zip") {
        await loadZipContents();
      } else if (fileType === "rar") {
        // For static sites, RAR files must be downloaded
        setFiles([
          {
            name: "Arkivat RAR duhet të shkarkohen",
            isRarNotice: true,
            message:
              "Për të parë përmbajtjen e skedarëve RAR, ju lutemi shkarkoni arkivin duke klikuar butonin 'Shkarko arkivin' më poshtë.",
          },
        ]);
      }
    } catch (err) {
      console.error("Gabim gjatë ngarkimit të arkivit:", err);
      setError(
        "Nuk mund të ngarkohet përmbajtja e arkivit. Ju lutemi shkarkoni skedarin."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadZipContents = async () => {
    try {
      // Use Cloudflare Worker proxy to avoid CORS issues
      const proxyUrl = `${WORKER_URL}/?action=proxy&url=${encodeURIComponent(
        material.r2Url
      )}`;

      const response = await fetch(proxyUrl, {
        cache: "no-cache",
      });

      if (!response.ok) {
        throw new Error(`Dështoi ngarkimi: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error("Skedari është bosh ose nuk mund të ngarkohet");
      }

      const zip = await JSZip.loadAsync(arrayBuffer);

      setZipObject(zip);

      const fileList = [];
      zip.forEach((relativePath, file) => {
        if (!file.dir) {
          fileList.push({
            name: relativePath,
            size: file._data?.uncompressedSize || 0,
            isFolder: false,
          });
        }
      });

      if (fileList.length === 0) throw new Error("Arkivi është bosh");
      fileList.sort((a, b) => a.name.localeCompare(b.name));
      setFiles(fileList);
    } catch (err) {
      console.error("Gabim ZIP:", err);
      throw err;
    }
  };

  const downloadFile = async (file) => {
    try {
      if (!zipObject) {
        console.error("Objekti ZIP nuk është i disponueshëm");
        return;
      }

      const zipFile = zipObject.file(file.name);
      if (!zipFile) {
        console.error("Skedari nuk u gjet në ZIP:", file.name);
        return;
      }

      setDownloadError("");
      const content = await inflateCapped(zipFile, MAX_ENTRY_BYTES);
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name.split("/").pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Gabim gjatë shkarkimit:", err);
      setDownloadError(
        err?.message === "entry-too-large"
          ? "Ky skedar është shumë i madh për t'u hapur këtu. Shkarkoni arkivin e plotë."
          : "Skedari nuk mund të shkarkohej nga arkivi."
      );
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const isFolder = fileName.includes("/") && !fileName.split("/").pop();

    if (isFolder) {
    return <Folder className="w-5 h-5 text-srh-sage" />;
    }
    return <FileText className="w-5 h-5 text-srh-crimson" />;
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay open={isOpen} onClose={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-3xl flex-col rounded-2xl border border-srh-cream bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="archive-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-srh-cream">
          <div>
            <h2 id="archive-modal-title" className="font-playfair text-2xl font-bold text-srh-navy">
              {material?.title}
            </h2>
            <p className="text-sm text-srh-navy/70 mt-1">
              {t("Përmbajtja e arkivit ({type})", { type: material?.fileType?.toUpperCase() })}
            </p>
          </div>
          <button
            type="button"
            data-autofocus
            onClick={onClose}
            aria-label={t("Mbyll")}
            className="p-2 hover:bg-srh-blush/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-srh-navy/70" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-srh-crimson animate-spin mb-4" />
              <p className="text-srh-navy/70">{t("Duke ngarkuar përmbajtjen...")}</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-srh-crimson mb-4" />
              <p className="text-srh-navy/70 text-center">{t(error)}</p>
            </div>
          )}

          {downloadError && (
            <p role="alert" className="mb-3 rounded-lg bg-burgundy-50 p-3 text-sm font-semibold text-burgundy-600">
              {t(downloadError)}
            </p>
          )}

          {!loading && !error && files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    file.isRarNotice
                      ? "bg-srh-cream/50 border border-srh-cream"
                      : "bg-srh-paper hover:bg-srh-blush/20"
                  } transition-colors`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {file.isRarNotice ? (
                      <>
                        <AlertCircle className="w-5 h-5 text-srh-sage flex-shrink-0" />
                        <div>
                          <p className="font-medium text-srh-navy">
                            {t(file.name)}
                          </p>
                          <p className="text-sm text-srh-navy/70">
                            {t(file.message)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        {getFileIcon(file.name)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-srh-navy truncate">
                            {file.name}
                          </p>
                          {file.size > 0 && (
                            <p className="text-xs text-srh-navy/70">
                              {formatFileSize(file.size)}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {!file.isRarNotice && zipObject && (
                    <button
                      onClick={() => downloadFile(file)}
                      className="ml-3 p-2 text-srh-crimson hover:bg-srh-blush/20 rounded-lg transition-colors flex-shrink-0"
                      title={t("Shkarko skedarin")}
                      aria-label={t("Shkarko {name}", { name: file.name })}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && !error && files.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-srh-cream mb-4" />
              <p className="text-srh-navy/70">
                {t("Arkivi është bosh ose nuk mund të lexohet.")}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-srh-cream bg-srh-paper rounded-b-2xl">
          <div className="flex space-x-3">
            <a
              href={material?.id ? materialDownloadUrl(material.id) : material?.r2Url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex-1 bg-srh-crimson text-white py-3 px-4 rounded-lg hover:bg-burgundy-700 transition-colors font-medium flex items-center justify-center"
            >
              <Download className="w-5 h-5 mr-2" />
              {t("Shkarko arkivin")}
            </a>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-srh-navy text-srh-navy rounded-lg hover:bg-srh-navy hover:text-white transition-colors font-medium"
            >
              {t("Mbyll")}
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}
