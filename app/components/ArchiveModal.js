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

export default function ArchiveModal({ isOpen, onClose, material }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zipObject, setZipObject] = useState(null);

  useEffect(() => {
    if (isOpen && material) {
      loadArchiveContents();
    }
  }, [isOpen, material]);

  const loadArchiveContents = async () => {
    setLoading(true);
    setError(null);
    setFiles([]);
    setZipObject(null);

    try {
      const fileType = material.fileType?.toLowerCase();

      if (fileType === "zip") {
        await loadZipContents();
      } else if (fileType === "rar") {
        // For RAR files, we'll show a message that we can't preview but can download
        setFiles([
          {
            name: "Arkivat RAR kërkojnë ekstraktim",
            isRarNotice: true,
            message:
              "Skedarët RAR nuk mund të shihen në shfletues. Ju lutemi shkarkoni skedarin për të parë përmbajtjen.",
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
      console.log("Duke ngarkuar ZIP nga:", material.r2Url);

      const response = await fetch(material.r2Url, {
        mode: "cors",
        cache: "no-cache",
      });

      console.log("Response status:", response.status, response.statusText);

      if (!response.ok) {
        throw new Error(
          `Dështoi ngarkimi: ${response.status} ${response.statusText}`
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log("ArrayBuffer size:", arrayBuffer.byteLength);

      // Check if it's actually a ZIP file
      if (arrayBuffer.byteLength < 4) {
        throw new Error("Skedari është shumë i vogël për të qenë ZIP");
      }

      const zip = await JSZip.loadAsync(arrayBuffer);
      console.log("ZIP loaded successfully");

      // Store the zip object for later extraction
      setZipObject(zip);

      const fileList = [];
      let fileCount = 0;

      zip.forEach((relativePath, file) => {
        if (!file.dir) {
          fileCount++;
          fileList.push({
            name: relativePath,
            size: file._data?.uncompressedSize || 0,
            isFolder: false,
          });
        }
      });

      console.log("Found", fileCount, "files in ZIP");

      if (fileCount === 0) {
        throw new Error("Arkivi është bosh");
      }

      // Sort files: folders first, then alphabetically
      fileList.sort((a, b) => {
        const aIsFolder = a.name.includes("/");
        const bIsFolder = b.name.includes("/");
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;
        return a.name.localeCompare(b.name);
      });

      setFiles(fileList);
    } catch (err) {
      console.error("Gabim detajuar:", err);
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
        console.error("Skedari nuk u gjet në arkiv:", file.name);
        return;
      }

      const content = await zipFile.async("blob");
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name.split("/").pop(); // Get just the filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Gabim gjatë shkarkimit të skedarit:", err);
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
      return <Folder className="w-5 h-5 text-yellow-600" />;
    }
    return <FileText className="w-5 h-5 text-blue-600" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {material?.title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Përmbajtja e arkivit ({material?.fileType?.toUpperCase()})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
              <p className="text-gray-600">Duke ngarkuar përmbajtjen...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
              <p className="text-gray-600 text-center">{error}</p>
            </div>
          )}

          {!loading && !error && files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    file.isRarNotice
                      ? "bg-yellow-50 border border-yellow-200"
                      : "bg-gray-50 hover:bg-gray-100"
                  } transition-colors`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {file.isRarNotice ? (
                      <>
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {file.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {file.message}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        {getFileIcon(file.name)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          {file.size > 0 && (
                            <p className="text-xs text-gray-500">
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
                      className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Shkarko skedarin"
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
              <FileText className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600">
                Arkivi është bosh ose nuk mund të lexohet.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex space-x-3">
            <a
              href={material?.r2Url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Shkarko arkivin
            </a>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Mbyll
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
