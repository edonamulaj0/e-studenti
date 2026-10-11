"use client";

import { useCallback, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { FileText, Search, SlidersHorizontal, X } from "lucide-react";
import MaterialGrid from "../components/MaterialGrid";
import FilterSidebar, { EMPTY_FILTERS } from "./FilterSidebar";
import { assignMaterialSlugs } from "../lib/material-slug";
import { WORKER_URL } from "../lib/worker-url";
import { normalizeMaterial } from "../lib/material-view";

const PAGE_SIZE = 24;

export default function MaterialsClient({ initialData = null }) {
  const [materials, setMaterials] = useState(() =>
    (initialData?.materials || initialData?.entries || []).map(normalizeMaterial)
  );
  const [loading, setLoading] = useState(!initialData);
  const [hasLoaded, setHasLoaded] = useState(Boolean(initialData));
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  // `filters` is what the list shows; `draft` is what the sidebar is editing.
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [subjects, setSubjects] = useState([]);
  const [selectedSort, setSelectedSort] = useState("newest");
  const [page, setPage] = useState(() => Number(initialData?.pagination?.page) || 1);
  const [pagination, setPagination] = useState(
    initialData?.pagination || {
      page: 1,
      limit: PAGE_SIZE,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
    }
  );
  const [availableTypeCounts, setAvailableTypeCounts] = useState(
    initialData?.typeCounts || {}
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const list = (name) => (params.get(name) || "").split(",").map((v) => v.trim()).filter(Boolean);
    const initial = {
      faculties: list("faculty").map((v) => v.toUpperCase()),
      types: list("type"),
      levels: list("niveli"),
      subjects: list("subjects"),
    };
    const sort = params.get("sort") || "newest";
    const q = params.get("q") || "";
    setFilters(initial);
    setDraft(initial);
    setSelectedSort(["views", "downloads"].includes(sort) ? sort : "newest");
    if (q) setSearchTerm(q);
  }, []);

  useEffect(() => {
    fetch(`${WORKER_URL}/?action=subjects`)
      .then((res) => (res.ok ? res.json() : { subjects: [] }))
      .then((data) => setSubjects(data.subjects || []))
      .catch(() => {});
  }, []);

  const materialsWithSlugs = useMemo(
    () => assignMaterialSlugs(materials),
    [materials]
  );

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
      if (filters.faculties.length) params.set("faculty", filters.faculties.join(","));
      if (filters.types.length) params.set("type", filters.types.join(","));
      if (filters.levels.length) params.set("niveli", filters.levels.join(","));
      if (filters.subjects.length) params.set("subjects", filters.subjects.join(","));
      if (selectedSort === "views" || selectedSort === "downloads") {
        params.set("sort", selectedSort);
      }

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
  }, [page, searchTerm, filters, selectedSort]);

  useEffect(() => {
    const timeout = window.setTimeout(loadMaterials, 250);
    return () => window.clearTimeout(timeout);
  }, [loadMaterials]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filters, selectedSort]);

  const filteredMaterials = materialsWithSlugs;

  const syncUrl = (next) => {
    const params = new URLSearchParams();
    if (next.faculties.length) params.set("faculty", next.faculties.join(","));
    if (next.types.length) params.set("type", next.types.join(","));
    if (next.levels.length) params.set("niveli", next.levels.join(","));
    if (next.subjects.length) params.set("subjects", next.subjects.join(","));
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  };

  const applyFilters = () => {
    setFilters(draft);
    setPage(1);
    syncUrl(draft);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
    syncUrl(EMPTY_FILTERS);
  };

  const activeFilterCount =
    filters.levels.length + filters.faculties.length + filters.types.length + filters.subjects.length;

  const runSearch = () => {
    setPage(1);
    loadMaterials();
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

  if (loading && !hasLoaded) {
    return (
      <div className="page-shell" role="status" aria-busy="true">
        <span className="sr-only">Duke ngarkuar materialet…</span>
        <div className="section-shell" aria-hidden="true">
          <div className="mb-10 max-w-3xl space-y-4">
            <div className="h-8 w-32 rounded-full bg-gray-200 motion-safe:animate-pulse" />
            <div className="h-12 w-2/3 rounded-lg bg-gray-200 motion-safe:animate-pulse" />
            <div className="h-5 w-full max-w-xl rounded-lg bg-gray-200 motion-safe:animate-pulse" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-36 rounded-3xl bg-gray-200/70 motion-safe:animate-pulse" />
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
        <header className="mb-5 max-w-3xl">
          <h1 className="page-title mb-2 !text-3xl md:!text-4xl">Materialet</h1>
          <p className="page-subtitle mb-3 max-w-2xl !text-base">
            Filtroni sipas fakultetit dhe llojit, ose shfletoni sipas{" "}
            <Link href="/lendet" className="font-semibold text-burgundy-600 underline underline-offset-2">
              lëndës
            </Link>.
          </p>
          <div className="flex flex-wrap gap-3 text-sm font-semibold text-gray-600">
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">
              {pagination.total} materiale
            </span>
            <span className="rounded-full bg-navy-100 px-3 py-1 text-navy-800">
              Faqja {currentPage} / {totalPages}
            </span>
          </div>
        </header>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="btn-outline min-h-[44px] justify-center lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            Filtrat{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden />
            <input
              type="text"
              placeholder="Kërko materiale…"
              aria-label="Kërko materiale"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              className="input-srh min-h-[44px] w-full pl-10 text-sm"
            />
          </div>
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="input-srh min-h-[44px] text-sm sm:w-48"
            aria-label="Rendit sipas"
          >
            <option value="newest">Më të rejat</option>
            <option value="views">Më të shikuarat</option>
            <option value="downloads">Më të shkarkuarat</option>
          </select>
        </div>

        <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-6">
          <aside className="hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)]">
            <div className="surface-card flex max-h-[calc(100vh-7rem)] flex-col p-4">
              <FilterSidebar
                id="filters-desktop"
                draft={draft}
                setDraft={setDraft}
                subjects={subjects}
                onApply={applyFilters}
                onClear={clearFilters}
              />
            </div>
          </aside>

          {filtersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtrat">
              <button
                type="button"
                aria-label="Mbyll filtrat"
                className="absolute inset-0 bg-navy-900/50"
                onClick={() => setFiltersOpen(false)}
              />
              <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-white p-4 shadow-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-navy-900">Filtrat</h2>
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(false)}
                    aria-label="Mbyll"
                    className="rounded-xl p-2 text-gray-600 hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </div>
                <FilterSidebar
                  id="filters-mobile"
                  draft={draft}
                  setDraft={setDraft}
                  subjects={subjects}
                  onApply={applyFilters}
                  onClear={clearFilters}
                />
              </div>
            </div>
          )}

          <div className="min-w-0">
        <div id="material-results" className="scroll-mt-28">
          <p className="sr-only" role="status" aria-live="polite">
            {loading ? "Duke përditësuar rezultatet…" : `${pagination.total} materiale u gjetën.`}
          </p>
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
              <FileText className="mx-auto mb-6 h-16 w-16 text-gray-500" />
              <h3 className="mb-2 text-2xl font-semibold text-navy-900">
                Nuk ka të dhëna
              </h3>
              <p className="text-gray-600">
                Provoni të ndryshoni kriteret e kërkimit.
              </p>
            </div>
          ) : (
            <MaterialGrid materials={filteredMaterials} columns="sm:grid-cols-2 2xl:grid-cols-3" />
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
        </div>
      </div>
    </div>
  );
}
