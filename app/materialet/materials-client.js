"use client";

import Link from "next/link";
import { useCallback, useState, useMemo, useEffect } from "react";
import {
  FileText,
  Download,
  Eye,
  Filter,
  Search,
  Archive,
  Flag,
} from "lucide-react";
import ArchiveModal from "../components/ArchiveModal";
import { FACULTIES, getFacultyName } from "../lib/material-options";
import { WORKER_URL } from "../lib/worker-url";

const PAGE_SIZE = 24;

function displayTeacher(material) {
  const t = material.teacher;
  if (t == null) return "—";
  const s = String(t).trim();
  if (!s || s === "//") return "—";
  return s;
}

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

function typeTone(type) {
  const value = String(type || "").toLowerCase();
  return (
    TYPE_TONES.find((tone) => value.includes(tone.match)) || {
      card: "border-navy-700/25 hover:border-navy-700/45",
      icon: "bg-navy-100 text-navy-700",
      chip: "bg-navy-100 text-navy-700",
    }
  );
}

function displaySubmitter(name) {
  const value = String(name || "").trim();
  return value;
}

function normalizeMaterial(material) {
  const isAnonymous = Boolean(material.is_anonymous);
  const rawName =
    material.submittedBy?.name ||
    material.uploader_name ||
    "";
  const displayName = isAnonymous ? "Anonim" : displaySubmitter(rawName);
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

export default function MaterialsClient() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
  });
  const [availableTypeCounts, setAvailableTypeCounts] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        action: "materials",
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (searchTerm.trim()) params.set("q", searchTerm.trim());
      if (selectedFaculty) params.set("faculty", selectedFaculty);
      if (selectedType) params.set("type", selectedType);

      const res = await fetch(`${WORKER_URL}/?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Fetch failed");
      setMaterials((data.materials || data.entries || []).map(normalizeMaterial));
      setAvailableTypeCounts(data.typeCounts || {});
      setPagination(
        data.pagination || {
          page,
          limit: PAGE_SIZE,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
        }
      );
    } catch {
      setError("Nuk mund të ngarkohen materialet. Provoni përsëri.");
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [page, searchTerm, selectedFaculty, selectedType]);

  useEffect(() => {
    const timeout = window.setTimeout(loadMaterials, 250);
    return () => window.clearTimeout(timeout);
  }, [loadMaterials]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedFaculty, selectedType]);

  const typeOptions = useMemo(() => {
    const fromServer = Object.keys(availableTypeCounts);
    if (fromServer.length > 0) {
      return fromServer.sort((a, b) => a.localeCompare(b, "sq"));
    }
    const set = new Set(materials.map((m) => m.type).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "sq"));
  }, [availableTypeCounts, materials]);

  const filteredMaterials = materials;

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedFaculty("");
    setSelectedType("");
    setPage(1);
  };

  const totalPages = Math.max(1, Number(pagination.totalPages || 1));
  const currentPage = Math.min(Math.max(1, Number(pagination.page || page)), totalPages);

  const goToPage = (nextPage) => {
    const clamped = Math.min(Math.max(1, nextPage), totalPages);
    if (clamped === currentPage) return;
    setPage(clamped);
    window.setTimeout(() => {
      document
        .getElementById("material-results")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  const isArchiveFile = (fileType) => {
    return (
      fileType?.toLowerCase() === "zip"
    );
  };

  const handleViewClick = (material, e) => {
    if (isArchiveFile(material.fileType)) {
      e.preventDefault();
      setSelectedMaterial(material);
      setModalOpen(true);
    }
  };

  const renderCard = (material) => {
    const tone = typeTone(material.type);
    const facultyName = getFacultyName(material.faculty);
    return (
    <div
      key={material.id}
      className={`surface-card group flex h-full flex-col p-5 hover:-translate-y-1 hover:shadow-md md:p-6 ${tone.card}`}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3
            className="mb-3 text-xl font-semibold leading-snug text-navy-900 transition-colors group-hover:text-burgundy-600"
          >
            {material.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="rounded-full bg-navy-100 px-3 py-1 font-semibold text-navy-800">
              {facultyName}
            </span>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${tone.chip}`}>
              {material.type}
            </span>
            <span>{material.department}</span>
          </div>
        </div>
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone.icon}`}>
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
        <div>
          <div className="rounded-2xl bg-white p-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Autor/e
            </span>
            <p className="mt-1 font-semibold text-navy-900">
              {displayTeacher(material)}
            </p>
          </div>
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
            {isArchiveFile(material.fileType) ? (
              <button
                type="button"
                onClick={(e) => handleViewClick(material, e)}
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
    );
  };

  if (loading && !hasLoaded) {
    return (
      <div className="page-shell">
        <div className="section-shell">
          <div className="mb-10 max-w-3xl">
            <p className="page-kicker mb-4">Biblioteka</p>
            <h1 className="page-title mb-4">
              Materialet
            </h1>
            <p className="page-subtitle">
              Duke ngarkuar materialet...
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-3xl bg-gray-200/70"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !hasLoaded) {
    return (
      <div className="page-shell">
        <div className="surface-card mx-auto max-w-2xl p-10 text-center">
          <FileText className="mx-auto mb-5 h-16 w-16 text-burgundy-600" />
          <h1 className="mb-4 font-display text-4xl font-bold text-navy-900">
            Materialet
          </h1>
          <p className="mb-6 text-gray-600">{error}</p>
          <button
            type="button"
            onClick={loadMaterials}
            className="btn-primary"
          >
            Provo përsëri
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="section-shell">
        <header className="mb-10 max-w-3xl">
          <p className="page-kicker mb-4">Biblioteka</p>
          <h1 className="page-title mb-4">
            Materialet
          </h1>
          <p className="page-subtitle mb-5 max-w-2xl">
            Gjeni shënime, afate dhe projekte — filtroni sipas fakultetit dhe
            llojit, pastaj hapni ose shkarkoni materialet.
          </p>
          <div className="flex flex-wrap gap-3 text-sm font-semibold text-gray-600">
            <span className="rounded-full bg-white px-4 py-2 shadow-sm">
              {pagination.total} materiale
            </span>
            <span className="rounded-full bg-burgundy-50 px-4 py-2 text-burgundy-600">
              {typeOptions.length} lloje
            </span>
            <span className="rounded-full bg-navy-100 px-4 py-2 text-navy-800">
              Faqja {currentPage} / {totalPages}
            </span>
          </div>
        </header>

        <div
          id="material-filters"
          className="sticky top-24 z-20 mb-8 py-3 backdrop-blur"
        >
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative md:col-span-2 xl:col-span-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Kërko titull, lëndë, autor…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-srh min-h-[44px] pl-12 text-sm"
              />
            </div>

            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="input-srh hidden min-h-[44px] text-sm md:block"
            >
              <option value="">Të gjitha fakultetet</option>
              {FACULTIES.map((faculty) => (
                <option key={faculty.code} value={faculty.code}>
                  {faculty.name}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input-srh hidden min-h-[44px] text-sm md:block"
            >
              <option value="">Të gjitha llojet</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="btn-primary hidden min-h-[44px] w-full py-2 text-sm md:inline-flex"
            >
              <Filter className="w-5 h-5" />
              Pastro filtrat
            </button>
          </div>

        </div>

        <div id="material-results" className="scroll-mt-28">
          {loading && hasLoaded && (
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white/80 p-4 text-sm font-semibold text-gray-600 shadow-sm">
              Duke përditësuar rezultatet...
            </div>
          )}
          {error && hasLoaded && (
            <div className="mb-6 rounded-2xl border border-burgundy-600/20 bg-burgundy-50 p-4 text-sm font-semibold text-burgundy-600">
              {error}
            </div>
          )}
          {filteredMaterials.length === 0 ? (
            <div className="surface-card mx-auto max-w-xl p-10 text-center">
              <FileText className="mx-auto mb-6 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-2xl font-semibold text-navy-900">
                Nuk ka të dhëna
              </h3>
              <p className="text-gray-600">
                Provoni të ndryshoni kriteret e kërkimit.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {filteredMaterials.map((m) => renderCard(m))}
            </div>
          )}
          {pagination.total > 0 && (
            <nav
              className="mt-10 flex flex-col items-center justify-between gap-4 sm:flex-row"
              aria-label="Faqosja e materialeve"
            >
              <p className="text-sm font-semibold text-gray-600">
                Shfaqen {(currentPage - 1) * PAGE_SIZE + 1}-
                {Math.min(currentPage * PAGE_SIZE, pagination.total)} nga{" "}
                {pagination.total} materiale
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                  className="btn-outline min-h-[42px] px-4 py-2 disabled:opacity-40"
                >
                  Më parë
                </button>
                {pageNumbers.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => goToPage(item)}
                    disabled={loading}
                    className={`min-h-[42px] min-w-[42px] rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                      item === currentPage
                        ? "bg-burgundy-600 text-white shadow-sm"
                        : "border border-gray-200 bg-white text-navy-900 hover:border-burgundy-600 hover:text-burgundy-600"
                    }`}
                    aria-current={item === currentPage ? "page" : undefined}
                  >
                    {item}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                  className="btn-outline min-h-[42px] px-4 py-2 disabled:opacity-40"
                >
                  Tjetër
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>

      <ArchiveModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        material={selectedMaterial}
      />
    </div>
  );
}
