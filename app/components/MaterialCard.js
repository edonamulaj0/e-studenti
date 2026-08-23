"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Eye, Archive } from "lucide-react";
import { getFacultyName } from "../lib/material-options";
import { assignMaterialSlugs } from "../lib/material-slug";
import { getStudyLevelLabel } from "../lib/study-levels";
import ArchiveModal from "./ArchiveModal";
import MaterialPreviewModal from "./MaterialPreviewModal";
import ReportButton from "./ReportButton";
import MaterialStatsBadge from "./MaterialStatsBadge";
import TrackableDownloadLink from "./TrackableDownloadLink";
import { materialDownloadUrl } from "../lib/worker-url";
import { trackMaterialView } from "../lib/track-material";
import { getFileTypeBadge, hasInBrowserView } from "../lib/file-preview";

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
    study_level: material.study_level || "bachelor",
    r2Url: material.r2Url || material.r2_url,
    fileType: material.fileType || material.file_type,
    fileSize: material.fileSize || material.file_size,
    view_count: Number(material.view_count || 0),
    download_count: Number(material.download_count || 0),
    is_anonymous: isAnonymous,
    submittedBy: displayName ? { name: displayName } : undefined,
  };
}

export default function MaterialCard({ material, allMaterials = [] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const tone = typeTone(material.type);
  const facultyName = getFacultyName(material.faculty);
  const slug =
    material.slug ||
    assignMaterialSlugs(allMaterials.length ? allMaterials : [material])[0]?.slug;
  const isArchive = material.fileType?.toLowerCase() === "zip";
  const fileBadge = getFileTypeBadge(material.fileType);
  const department = displayDepartment(material.department);

  return (
    <>
      <div
        className={`surface-card group flex h-full flex-col p-4 hover:-translate-y-1 hover:shadow-md md:p-5 ${tone.card}`}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="mb-2 text-lg font-semibold leading-snug text-navy-900 transition-colors group-hover:text-burgundy-600">
              {slug ? (
                <Link href={`/materialet/${slug}`} className="hover:text-burgundy-600">
                  {material.title}
                </Link>
              ) : (
                material.title
              )}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
              <span className="rounded-full bg-navy-100 px-2.5 py-0.5 font-semibold text-navy-800">
                {facultyName}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 font-semibold ${tone.chip}`}>
                {material.type}
              </span>
              <span className="rounded-full bg-white px-2.5 py-0.5 font-semibold text-navy-700 ring-1 ring-navy-100">
                {getStudyLevelLabel(material.study_level)}
              </span>
              {department && <span>{department}</span>}
            </div>
          </div>
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold tracking-tight ${fileBadge.className}`}
          >
            {fileBadge.label}
          </span>
        </div>

        {/* One line each: the labelled panels these replaced cost about 110px
            of card height for two short values. */}
        <div className="mb-3 space-y-0.5 text-sm">
          <p className="truncate">
            <span className="text-gray-400">Lënda:</span>{" "}
            <span className="font-semibold text-navy-900">{material.subject}</span>
          </p>
          <p className="truncate">
            <span className="text-gray-400">Autor/e:</span>{" "}
            <span className="font-semibold text-navy-900">{displayTeacher(material)}</span>
          </p>
        </div>

        <div className="mb-3 mt-auto flex items-start justify-between gap-3">
          <ReportButton materialId={material.id} materialTitle={material.title} materialUrl={material.r2Url} />
          <div className="flex min-w-0 flex-col items-end gap-1">
            {material.submittedBy?.name && (
              <span className="truncate text-sm text-gray-400">
                {material.submittedBy.name}
              </span>
            )}
            <MaterialStatsBadge
              viewCount={material.view_count}
              downloadCount={material.download_count}
              className="justify-end"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {material.r2Url && (
            <>
              {/* RAR has no viewer, so it gets the download button only. */}
              {hasInBrowserView(material.fileType) &&
                (isArchive ? (
                  <button
                    type="button"
                    onClick={() => {
                      trackMaterialView(material.id);
                      setModalOpen(true);
                    }}
                    className="btn-outline flex-1 text-base"
                  >
                    <Archive className="w-5 h-5" />
                    Permbajtja
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      trackMaterialView(material.id);
                      setPreviewOpen(true);
                    }}
                    className="btn-primary flex-1 text-base"
                  >
                    <Eye className="w-5 h-5" />
                    Shiko
                  </button>
                ))}
            <TrackableDownloadLink
              materialId={material.id}
              href={materialDownloadUrl(material.id)}
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
            </TrackableDownloadLink>
            </>
          )}
        </div>
      </div>

      <ArchiveModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        material={material}
      />

      <MaterialPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        material={material}
      />
    </>
  );
}
