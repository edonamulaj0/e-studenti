/**
 * Presentation helpers shared by the material cards: type colours, how empty
 * fields are shown, and the shape a card expects (API rows and legacy "entries"
 * both normalise to it).
 */

import { DEFAULT_UNIVERSITY } from "../../shared/material-options.mjs";

const TYPE_TONES = [
  {
    match: "ligjerata",
    card: "border-info-blue/35 hover:border-info-blue/60",
    icon: "bg-info-blue/10 text-info-text",
    chip: "bg-info-blue/10 text-info-text",
  },
  {
    match: "afat",
    card: "border-warning-amber/45 hover:border-warning-amber/70",
    icon: "bg-warning-amber/10 text-warning-text",
    chip: "bg-warning-amber/10 text-warning-text",
  },
  {
    match: "projekt",
    card: "border-success-green/35 hover:border-success-green/60",
    icon: "bg-success-green/10 text-success-text",
    chip: "bg-success-green/10 text-success-text",
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

const LEVEL_TONES = {
  bachelor: "bg-teal-100 text-teal-900 dark:bg-teal-400/15 dark:text-teal-200",
  master: "bg-violet-100 text-violet-900 dark:bg-violet-400/15 dark:text-violet-200",
  phd: "bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-400/15 dark:text-fuchsia-200",
};

export function levelTone(level) {
  return LEVEL_TONES[level] || LEVEL_TONES.bachelor;
}

export function displayTeacher(material) {
  const t = material.teacher;
  if (t == null) return "—";
  const s = String(t).trim();
  if (!s || s === "//") return "—";
  return s;
}

export function displayDepartment(dep) {
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
    slug: material.slug,
    title: material.title,
    university: material.university || DEFAULT_UNIVERSITY,
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
    uploader_trusted: !isAnonymous && Boolean(material.uploader_trusted),
    submittedBy: displayName ? { name: displayName } : undefined,
  };
}
