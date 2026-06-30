"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Download, Eye, Archive, Flag } from "lucide-react";
import { getFacultyName } from "../lib/material-options";
import ArchiveModal from "./ArchiveModal";

const TYPE_TONES = [
  {
    match: "ligjerata",
    card: "border-info-blue/35 hover:border-info-blue/60",
    icon: "bg-info-blue/10 text-info-blue",
    chip: "bg-info-blue/10 text-info-blue",
  },
  {
    match: "afat",
    card: "border-warning-amber/45 hover:border-warning-amber/70",
    icon: "bg-warning-amber/10 text-warning-amber",
    chip: "bg-warning-amber/10 text-warning-amber",
  },
  {
    match: "projekt",
    card: "border-success-green/35 hover:border-success-green/60",
    icon: "bg-success-green/10 text-success-green",
    chip: "bg-success-green/10 text-success-green",
  },
  {
    match: "lib",
    card: "border-burgundy-600/30 hover:border-burgundy-600/55",
    icon: "bg-burgundy-50 text-burgundy-600",
    chip: "bg-burgundy-50 text-burgundy-600",
  },
];

export function typeTone(type) {
  const value = String(type || "").toLowerCase();
  return (
    TYPE_TONES.find((tone) => value.includes(tone.match)) || {
      card: "border-navy-700/25 hover:border-navy-700/45",
      icon: "bg-navy-100 text-navy-700",
      chip: "bg-navy-100 text-navy-700",
    }
  );
}

function displayTeacher(material) {
  const t = material.teacher;
  if (t == null) return "—";
  const s = String(t).trim();
  if (!s || s === "//") return "—";
  return s;
}

function displayDepartment(dep) {
  const s = String(dep || "").trim();
  if (!s || s === "//") return null;
  return s;
}

export function normalizeMaterial(material) {
  const isAnonymous = Boolean(material.is_anonymous);
  const rawName =
    material.submittedBy?.name ||
    material.uploader_name ||
    "";
  const displayName = isAnonymous ? "Anonim" : rawName;
  return {
    id: material.id,
    title: material.title,
    faculty: material.faculty,
    department: material.department || "//",
    type: material.type,
    subject: material.subject,
    teacher: material.teacher || "//",
    r2Url: material.r2Url || material.r2_url,
    fileType: material.fileType || material.file_type,
    fileSize: material.fileSize || material.file_size,
    is_anonymous: isAnonymous,
    submittedBy: displayName ? { name: displayName } : undefined,
  };
}

export default function MaterialCard({ material }) {
  const [modalOpen, setModalOpen] = useState(false);
  const tone = typeTone(material.type);
  const facultyName = getFacultyName(material.faculty);
  const isArchive = material.fileType?.toLowerCase() === "zip";
  const department = displayDepartment(material.department);

  return (
    <>
      <div
        className={`surface-card group flex h-full flex-col p-5 hover:-translate-y-1 hover:shadow-md md:p-6 ${tone.card}`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="mb-3 text-xl font-semibold leading-snug text-navy-900 transition-colors group-hover:text-burgundy-600">
              {material.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span className="rounded-full bg-navy-100 px-3 py-1 font-semibold text-navy-800">
                {facultyName}
              </span>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${tone.chip}`}>
                {material.type}
              </span>
              {department && <span>{department}</span>}
            </div>
          </div>
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone.icon}`}
          >
            <FileText className="h-6 w-6" />
          </span>
        </div>

        <div className="mb-6 grid gap-3 text-sm">
          <div className="rounded-2xl bg-navy-100/40 p-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Lënda
            </span>
            <p className="mt-1 font-semibold text-navy-900">{material.subject}</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Autor/e
            </span>
            <p className="mt-1 font-semibold text-navy-900">{displayTeacher(material)}</p>
          </div>
        </div>

        <div className="mb-4 mt-auto flex items-center justify-between gap-3">
          <Link
            href={`/informacione?subject=${encodeURIComponent("Raportoj material")}#kontakt`}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 underline decoration-dotted underline-offset-4 transition-colors hover:text-burgundy-600"
          >
            <Flag className="w-4 h-4" />
            Raporto
          </Link>
          {material.submittedBy?.name && (
            <span className="truncate text-right text-sm text-gray-400">
              Dërguar nga: {material.submittedBy.name}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-auto">
          {material.r2Url && (
            <>
              {isArchive ? (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="btn-outline flex-1 text-base"
                >
                  <Archive className="w-5 h-5" />
                  Permbajtja
                </button>
              ) : (
                <a
                  href={material.r2Url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex-1 text-base"
                >
                  <Eye className="w-5 h-5" />
                  Shiko
                </a>
              )}
              <a
                href={material.r2Url}
                target="_blank"
                rel="noopener noreferrer"
                download={
                  material.title.replace(/[^a-z0-9]/gi, "_") +
                  "." +
                  (material.fileType || "pdf")
                }
                className="btn-secondary flex-1 text-base"
              >
                <Download className="w-5 h-5" />
                Shkarko
              </a>
            </>
          )}
        </div>
      </div>

      <ArchiveModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        material={material}
      />
    </>
  );
}
