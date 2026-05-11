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
  Layers,
  Flag,
} from "lucide-react";
import ArchiveModal from "../components/ArchiveModal";
import { WORKER_URL } from "../lib/worker-url";

const PAGE_SIZE = 24;

function typeSectionId(type) {
  return `mat-section-${encodeURIComponent(type)}`;
}

function displayTeacher(material) {
  const t = material.teacher;
  if (t == null) return "—";
  const s = String(t).trim();
  if (!s || s === "//") return "—";
  return s;
}

function normalizeMaterial(material) {
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
    submittedBy:
      material.submittedBy ||
      (material.uploader_name ? { name: material.uploader_name } : undefined),
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
  const [activeSection, setActiveSection] = useState(null);

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
  const typeCounts = availableTypeCounts;

  const groupedByType = useMemo(() => {
    const map = new Map();
    for (const m of filteredMaterials) {
      const t = m.type || "Të pa klasifikuara";
      if (!map.has(t)) map.set(t, []);
      map.get(t).push(m);
    }
    const keys = Array.from(map.keys()).sort((a, b) =>
      a.localeCompare(b, "sq")
    );
    return { map, keys };
  }, [filteredMaterials]);

  const showGrouped = selectedType === "";

  useEffect(() => {
    if (!showGrouped || groupedByType.keys.length === 0) {
      setActiveSection(null);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting && e.intersectionRatio > 0.2)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          const id = visible[0].target.id.replace(/^mat-section-/, "");
          setActiveSection(decodeURIComponent(id));
        }
      },
      { rootMargin: "-35% 0px -40% 0px", threshold: [0.15, 0.35, 0.5] }
    );

    groupedByType.keys.forEach((type) => {
      const el = document.getElementById(typeSectionId(type));
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [showGrouped, groupedByType.keys]);

  const scrollToSection = (type) => {
    const id = typeSectionId(type);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

  const renderCard = (material) => (
    <div
      key={material.id}
      className="surface-card group flex h-full flex-col p-6 hover:-translate-y-1 hover:border-burgundy-600/30 hover:shadow-md md:p-7"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3
            className={`text-xl font-semibold leading-snug text-navy-900 transition-colors group-hover:text-burgundy-600 ${
              material.submittedBy?.name ? "mb-2" : "mb-3"
            }`}
          >
            {material.title}
          </h3>
          {material.submittedBy?.name && (
            <div className="mb-3">
              <span className="inline-flex rounded-full border border-success-green/15 bg-success-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-success-green">
                Dërguar nga: {material.submittedBy.name}
              </span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="rounded-full bg-navy-100 px-3 py-1 font-semibold text-navy-800">
              {material.faculty}
            </span>
            <span>{material.department}</span>
          </div>
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-burgundy-50 text-burgundy-600">
          <FileText className="h-6 w-6" />
        </span>
      </div>

      <div className="mb-6 grid gap-3 text-sm">
        <div className="rounded-2xl border border-gray-200 bg-navy-100/40 p-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Lënda
          </span>
          <p className="mt-1 font-semibold text-navy-900">{material.subject}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Lloji
            </span>
            <p className="mt-1 font-semibold text-navy-900">{material.type}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Autor/e
            </span>
            <p className="mt-1 font-semibold text-navy-900">
              {displayTeacher(material)}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 mt-auto">
        <Link
          href={`/informacione?subject=${encodeURIComponent("Raportoj material")}#kontakt`}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 underline decoration-dotted underline-offset-4 transition-colors hover:text-burgundy-600"
        >
          <Flag className="w-4 h-4" />
          Raporto
        </Link>
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
                Shiko përmbajtjen
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
        <header className="viewport-panel mb-10 flex items-center">
          <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="page-kicker mb-4">Biblioteka</p>
              <h1 className="page-title mb-4">
            Materialet
              </h1>
              <p className="page-subtitle max-w-2xl text-lg md:text-xl">
                Gjeni shënime, afate dhe projekte — filtroni sipas fakultetit dhe
                seksionit, pastaj hapni ose shkarkoni materialet.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-gray-600">
                <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                  {pagination.total} materiale
                </span>
                <span className="rounded-full bg-burgundy-50 px-4 py-2 text-burgundy-600">
                  {typeOptions.length} seksione
                </span>
                <span className="rounded-full bg-navy-100 px-4 py-2 text-navy-800">
                  Faqja {currentPage} / {totalPages}
                </span>
              </div>
            </div>
            <div className="surface-card hidden p-6 lg:block">
              <div className="mb-5 flex items-center justify-between">
                <span className="rounded-full bg-navy-100 px-3 py-1 text-sm font-semibold text-navy-800">
                  Kërkim i shpejtë
                </span>
                <Layers className="h-5 w-5 text-burgundy-600" />
              </div>
              <p className="text-sm leading-relaxed text-gray-600">
                Përdorni filtrat për të ngushtuar materialet sipas fakultetit,
                llojit dhe fjalëve kyçe. Rezultatet grupohen automatikisht sipas
                seksionit për skanim më të lehtë.
              </p>
            </div>
          </div>
        </header>

        <div
          id="material-filters"
          className="surface-card sticky top-24 z-20 mb-12 p-4 md:p-5"
        >
          <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative md:col-span-2 xl:col-span-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Kërko titull, lëndë, autor…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-srh pl-12"
              />
            </div>

            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="input-srh"
            >
              <option value="">Të gjitha fakultetet</option>
              <option value="ART">Artet</option>
              <option value="ECON">Ekonomiku</option>
              <option value="EDU">Edukimi</option>
              <option value="FA">Arkitektura</option>
              <option value="FBV">FBV</option>
              <option value="FEFS">FEFS</option>
              <option value="FFL">Filologjiku</option>
              <option value="FFZ">Filozofiku</option>
              <option value="FIEK">FIEK</option>
              <option value="FIM">FIM</option>
              <option value="FIN">FIN</option>
              <option value="FSHMN">FSHMN</option>
              <option value="LAW">Juridiku</option>
              <option value="MED">Mjekësia</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input-srh"
            >
              <option value="">Të gjitha seksionet (llojet)</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="btn-primary w-full"
            >
              <Filter className="w-5 h-5" />
              Pastro filtrat
            </button>
          </div>

          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="mr-2 flex items-center gap-2 text-sm font-semibold text-navy-900">
              <Layers className="w-5 h-5 text-success-green" />
              Seksione (lloji):
            </span>
            <button
              type="button"
              onClick={() => setSelectedType("")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                selectedType === ""
                  ? "scale-105 bg-burgundy-600 text-white shadow-sm"
                  : "border border-gray-200 bg-white text-navy-900 hover:border-burgundy-600 hover:text-burgundy-600"
              }`}
            >
              Të gjitha
            </button>
            {typeOptions.map((t) => {
              const displayCount = typeCounts[t] ?? 0;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setSelectedType(t);
                    setTimeout(() => {
                      document
                        .getElementById("material-results")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    }, 80);
                  }}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                    selectedType === t
                      ? "bg-burgundy-600 text-white shadow-sm"
                      : "border border-gray-200 bg-white text-navy-900 hover:border-burgundy-600 hover:text-burgundy-600"
                  }`}
                >
                  {t}{" "}
                  <span className="opacity-80 font-semibold">
                    ({displayCount})
                  </span>
                </button>
              );
            })}
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
            ) : showGrouped ? (
              <div key="grouped" className="space-y-16 md:space-y-20">
                {groupedByType.keys.map((type) => (
                  <section
                    key={type}
                    id={typeSectionId(type)}
                    className="viewport-section-start scroll-mt-28 px-0 py-0"
                  >
                    <div className="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gray-400">
                          Seksioni
                        </p>
                        <h2 className="font-display text-3xl font-bold text-navy-900 md:text-4xl">
                          {type}
                        </h2>
                      </div>
                      <span className="shrink-0 rounded-full bg-burgundy-50 px-4 py-2 text-sm font-semibold text-burgundy-600">
                        {groupedByType.map.get(type).length}{" "}
                        {groupedByType.map.get(type).length === 1
                          ? "material"
                          : "materiale"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
                      {groupedByType.map.get(type).map((m) => renderCard(m))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {filteredMaterials.map((m) => renderCard(m))}
              </div>
            )}
          {pagination.total > 0 && (
            <nav
              className="mt-10 flex flex-col items-center justify-between gap-4 rounded-3xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:flex-row"
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
