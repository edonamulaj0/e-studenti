"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, Link2, Check } from "lucide-react";
import { DEFAULT_UNIVERSITY, universityName, universityShort } from "../lib/placement";
import ReportButton from "./ReportButton";
import MaterialViewTracker from "./MaterialViewTracker";
import MaterialPreviewModal from "./MaterialPreviewModal";
import ArchiveContents from "./ArchiveContents";
import PdfCanvasViewer from "./PdfCanvasViewer";
import { FileBadge } from "./MaterialCard";
import TrackableDownloadLink from "./TrackableDownloadLink";
import { WORKER_URL, materialDownloadUrl } from "../lib/worker-url";
import { getFacultyName } from "../lib/material-options";
import { getStudyLevelLabel } from "../lib/study-levels";
import { formatFileSize, getPreviewKind, hasInBrowserView } from "../lib/file-preview";
import { formatStatCount, trackMaterialView } from "../lib/track-material";
import { formatDate } from "../lib/format-date";
import { isRealSubject, subjectSlug } from "../lib/subjects";
import { normalizeMaterial } from "../lib/material-view";
import { useT } from "./Preferences";

function displayTeacher(teacher) {
  const value = String(teacher || "").trim();
  if (!value || value === "//") return null;
  return value;
}

/** Renders `children` once the placeholder scrolls near the viewport (keeps big PDFs from loading unseen). */
function WhenVisible({ children, minHeight = "20rem" }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ minHeight: seen ? undefined : minHeight }}>
      {seen ? children : null}
    </div>
  );
}

function PreviewPanel({ card }) {
  const t = useT();
  const [modalOpen, setModalOpen] = useState(false);
  const [fileCount, setFileCount] = useState(null);
  const kind = getPreviewKind(card.fileType);
  if (!card.r2Url) return null;

  const fullScreen = (
    <button
      type="button"
      onClick={() => {
        trackMaterialView(card.id);
        setModalOpen(true);
      }}
      className="text-sm font-bold text-navy-900 hover:text-burgundy-600"
    >
      {t("Hap në ekran të plotë")}
    </button>
  );

  let header = t("Parapamja");
  let body;
  if (kind === "pdf") {
    body = (
      <WhenVisible minHeight="36rem">
        <div className="h-[36rem] bg-gray-100">
          <PdfCanvasViewer url={`${WORKER_URL}/?action=proxy&url=${encodeURIComponent(card.r2Url)}`} title={card.title} />
        </div>
      </WhenVisible>
    );
  } else if (kind === "archive" && card.fileType?.toLowerCase() === "zip") {
    header = fileCount == null ? t("Përmbajtja e arkivit") : t("Përmbajtja e arkivit · {n} skedarë", { n: fileCount });
    body = (
      <WhenVisible minHeight="8rem">
        <ArchiveContents url={card.r2Url} onCount={setFileCount} />
      </WhenVisible>
    );
  } else if (!hasInBrowserView(card.fileType)) {
    return (
      <p className="rounded-2xl border border-gray-200 bg-surface p-5 text-sm text-gray-600">
        {t("Arkivat RAR nuk hapen në shfletues — shkarkoni skedarin për të parë përmbajtjen.")}
      </p>
    );
  } else {
    body = (
      <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <p className="text-sm text-gray-600">{t("Ky lloj skedari hapet në një dritare parapamjeje.")}</p>
        <button
          type="button"
          onClick={() => {
            trackMaterialView(card.id);
            setModalOpen(true);
          }}
          className="btn-primary"
        >
          {t("Shiko materialin")}
        </button>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-sm" aria-label={header}>
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-2.5 text-sm text-gray-600">
        <span>{header}</span>
        {kind !== "archive" && fullScreen}
      </div>
      {body}
      <MaterialPreviewModal isOpen={modalOpen} onClose={() => setModalOpen(false)} material={card} />
    </section>
  );
}

function MoreFromSubject({ material, slug }) {
  const t = useT();
  const [items, setItems] = useState([]);
  const subject = isRealSubject(material.subject) ? material.subject : null;
  const subjectLink = subject ? subjectSlug(material.faculty, subject, material.university) : null;

  useEffect(() => {
    if (!subjectLink) return undefined;
    let cancelled = false;
    fetch(`${WORKER_URL}/?action=materials&subjects=${encodeURIComponent(subjectLink)}&sort=downloads&limit=4`)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        if (cancelled) return;
        const rows = (data.materials || data.entries || []).map(normalizeMaterial);
        setItems(rows.filter((m) => String(m.id) !== String(material.id)).slice(0, 3));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [subjectLink, material.id]);

  if (!subject || items.length === 0) return null;
  return (
    <section className="mt-10" aria-labelledby="more-from-subject">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 id="more-from-subject" className="font-display text-xl font-bold text-navy-900">
          {t("Më shumë nga {subject}", { subject })}
        </h2>
        <Link href={`/lenda/${subjectLink}`} className="text-sm font-bold text-burgundy-600 hover:underline">
          {t("Shih të gjitha")}
        </Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => (
          <li key={m.id}>
            <Link
              href={m.slug ? `/materialet/${m.slug}` : "/materialet"}
              className="surface-card flex h-full gap-3 p-3 hover:shadow-md"
              aria-current={m.slug === slug ? "page" : undefined}
            >
              <FileBadge fileType={m.fileType} className="self-start" />
              <span className="min-w-0">
                <span className="line-clamp-2 font-display text-sm font-bold text-navy-900">{m.title}</span>
                <span className="mt-0.5 block text-xs text-gray-600">
                  {t(m.type)} · {t("{n} shkarkime", { n: formatStatCount(m.download_count) })}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Detail view of one material. Shared by the statically built page and the
 * client-side fallback for materials added since the last build, so it holds no
 * server-only code.
 */
export default function MaterialDetail({ material, slug }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const card = { ...normalizeMaterial(material), r2Url: material.r2_url || material.r2Url, fileType: material.file_type || material.fileType };
  const university = material.university || DEFAULT_UNIVERSITY;
  const facultyName = t(getFacultyName(material.faculty));
  const level = t(getStudyLevelLabel(material.study_level || "bachelor"));
  const teacher = displayTeacher(material.teacher);
  const size = formatFileSize(material.file_size || material.fileSize);
  const uploadedOn = formatDate(String(material.created_at || "").slice(0, 10), t);
  const hasSubject = isRealSubject(material.subject);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/materialet/${slug}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard can be blocked */
    }
  };

  const metaRows = [
    hasSubject && [t("Lënda"), material.subject],
    [t("Profesor/i"), teacher || t("Nuk është specifikuar")],
    [t("Universiteti"), universityName(university)],
    [t("Fakulteti"), facultyName],
    [t("Ngarkuar"), [uploadedOn !== "—" ? uploadedOn : null, t(material.display_uploader)].filter(Boolean).join(" · ")],
  ].filter(Boolean);

  return (
    <div className="page-shell !py-8 md:!py-10">
      <MaterialViewTracker materialId={material.id} />
      <div className="section-shell">
        <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-sm text-gray-600" aria-label={t("Rruga")}>
          <Link href="/materialet" className="hover:text-burgundy-600">
            {t("Materialet")}
          </Link>
          <span aria-hidden>/</span>
          <Link href={`/materialet?university=${university}`} className="hover:text-burgundy-600">
            {universityShort(university)}
          </Link>
          {hasSubject && (
            <>
              <span aria-hidden>/</span>
              <Link href={`/lenda/${subjectSlug(material.faculty, material.subject, university)}`} className="hover:text-burgundy-600">
                {material.subject}
              </Link>
            </>
          )}
        </nav>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="min-w-0 space-y-4">
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm text-gray-600">
                <FileBadge fileType={card.fileType} />
                {t(material.type)} · {level}
              </p>
              <h1 className="font-display text-3xl font-bold leading-tight text-navy-900 md:text-4xl">{material.title}</h1>
            </div>
            <PreviewPanel card={card} />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="surface-card space-y-3 p-4">
              {material.r2_url && (
                <TrackableDownloadLink
                  materialId={material.id}
                  href={materialDownloadUrl(material.id)}
                  download={material.title.replace(/[^a-z0-9]/gi, "_") + "." + (card.fileType || "pdf")}
                  className="btn-secondary w-full"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  {t("Shkarko")}
                  {size && ` · ${size}`}
                </TrackableDownloadLink>
              )}
              <button type="button" onClick={copyLink} className="btn-outline w-full min-h-[40px] py-2">
                {copied ? <Check className="h-4 w-4" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
                {copied ? t("U kopjua") : t("Kopjo lidhjen")}
              </button>
              <p className="text-xs text-gray-600">
                {t("{n} shikime", { n: formatStatCount(Number(material.view_count || 0)) })}
                <span className="mx-2 text-gray-400">·</span>
                {t("{n} shkarkime", { n: formatStatCount(Number(material.download_count || 0)) })}
              </p>
            </div>

            <dl className="surface-card space-y-3 p-4 text-sm">
              {metaRows.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-gray-500">{label}</dt>
                  <dd className="font-semibold text-navy-900">{value}</dd>
                </div>
              ))}
            </dl>

            <p className="flex flex-wrap items-center gap-1.5 px-1 text-xs text-gray-600">
              {t("Diçka nuk është në rregull me këtë skedar?")}
              <ReportButton
                materialId={material.id}
                materialTitle={material.title}
                materialUrl={material.r2_url}
              />
            </p>
          </aside>
        </div>

        <MoreFromSubject material={material} slug={slug} />
      </div>
    </div>
  );
}
