"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Filter, Link2, Plus, Search } from "lucide-react";
import ExternalLinkGate from "../components/ExternalLinkGate";
import { FACULTIES, getFacultyName } from "../lib/material-options";
import { RESOURCE_CATEGORIES, getResourceCategoryLabel } from "../lib/resource-options";
import { WORKER_URL } from "../lib/worker-url";

const PAGE_SIZE = 24;

function normalizeLink(link) {
  const isAnonymous = Boolean(link.is_anonymous);
  const submitter = isAnonymous ? "Anonim" : link.submitter_name || "";
  return {
    ...link,
    submitter_name: submitter || undefined,
  };
}

export default function BurimeClient({ initialData = null }) {
  const [links, setLinks] = useState(() =>
    (initialData?.links || []).map(normalizeLink)
  );
  const [loading, setLoading] = useState(!initialData);
  const [hasLoaded, setHasLoaded] = useState(Boolean(initialData));
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(
    initialData?.pagination || {
      page: 1,
      limit: PAGE_SIZE,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
    }
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSelectedFaculty((params.get("faculty") || "").toUpperCase());
    setSelectedCategory(params.get("category") || "");
    const q = params.get("q") || "";
    if (q) setSearchTerm(q);
  }, []);

  const loadLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        action: "resource-links",
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (searchTerm.trim()) params.set("q", searchTerm.trim());
      if (selectedFaculty) params.set("faculty", selectedFaculty);
      if (selectedCategory) params.set("category", selectedCategory);

      const res = await fetch(`${WORKER_URL}/?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Fetch failed");
      setLinks((data.links || []).map(normalizeLink));
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
      setError("Nuk mund të ngarkohen burimet. Provoni përsëri.");
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [page, searchTerm, selectedFaculty, selectedCategory]);

  useEffect(() => {
    const timeout = window.setTimeout(loadLinks, 250);
    return () => window.clearTimeout(timeout);
  }, [loadLinks]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedFaculty, selectedCategory]);

  const totalPages = Math.max(1, Number(pagination.totalPages || 1));
  const currentPage = Math.min(Math.max(1, Number(pagination.page || page)), totalPages);

  const goToPage = (nextPage) => {
    const clamped = Math.min(Math.max(1, nextPage), totalPages);
    if (clamped === currentPage) return;
    setPage(clamped);
  };

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedFaculty("");
    setSelectedCategory("");
    setPage(1);
  };

  if (loading && !hasLoaded) return null;

  return (
    <div className="page-shell">
      <div className="section-shell">
        <header className="mb-10 max-w-3xl">
          <p className="page-kicker mb-4">Lidhje të dobishme</p>
          <h1 className="page-title mb-4">Burime shtesë</h1>
          <p className="page-subtitle mb-5 max-w-2xl">
            Faqe kursi, dosje Drive, MEGA dhe burime të tjera — të dërguara nga
            komuniteti dhe të aprovuara nga moderatorët para publikimit.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/burime/dergo" className="btn-primary">
              <Plus className="h-5 w-5" />
              Dërgo lidhje
            </Link>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm">
              {pagination.total} lidhje të aprovuara
            </span>
          </div>
        </header>

        <div className="sticky top-24 z-20 mb-8 py-3 backdrop-blur">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative md:col-span-2 xl:col-span-2">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Kërko titull, përshkrim, domen…"
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
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-srh hidden min-h-[44px] text-sm md:block"
            >
              <option value="">Të gjitha kategoritë</option>
              {RESOURCE_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
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

        {loading && hasLoaded && (
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white/80 p-4 text-sm font-semibold text-gray-600">
            Duke përditësuar rezultatet...
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-2xl border border-burgundy-600/20 bg-burgundy-50 p-4 text-sm font-semibold text-burgundy-600">
            {error}
          </div>
        )}

        {links.length === 0 ? (
          <div className="surface-card mx-auto max-w-xl p-10 text-center">
            <Link2 className="mx-auto mb-6 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-2xl font-semibold text-navy-900">
              Nuk ka lidhje të aprovuara
            </h3>
            <p className="mb-6 text-gray-600">
              Provoni filtra të tjerë ose dërgoni një lidhje të re për moderim.
            </p>
            <Link href="/burime/dergo" className="btn-primary">
              Dërgo lidhje
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {links.map((link) => (
              <article key={link.id} className="surface-card flex h-full flex-col p-5 md:p-6">
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-navy-100 px-3 py-1 text-xs font-semibold text-navy-800">
                    {getFacultyName(link.faculty)}
                  </span>
                  <span className="rounded-full bg-burgundy-50 px-3 py-1 text-xs font-semibold text-burgundy-600">
                    {getResourceCategoryLabel(link.category)}
                  </span>
                </div>
                <h2 className="mb-2 text-xl font-semibold text-navy-900">{link.title}</h2>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-600">
                  {link.description}
                </p>
                {link.subject && link.subject !== "//" && (
                  <p className="mb-3 text-sm text-gray-500">Lënda: {link.subject}</p>
                )}
                <div className="mb-4 flex items-center justify-between gap-3 text-sm">
                  <span className="rounded-lg bg-navy-100/50 px-3 py-1.5 font-mono text-xs font-semibold text-navy-800">
                    {link.resolved_domain}
                  </span>
                  {link.submitter_name && (
                    <span className="truncate text-gray-400">
                      nga {link.submitter_name}
                    </span>
                  )}
                </div>
                <ExternalLinkGate
                  href={link.resolved_url}
                  domain={link.resolved_domain}
                  className="btn-primary w-full text-base"
                >
                  <ExternalLink className="h-5 w-5" />
                  Hap lidhjen
                </ExternalLinkGate>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {pageNumbers.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => goToPage(num)}
                className={`min-h-[44px] min-w-[44px] rounded-xl px-4 py-2 text-sm font-bold ${
                  num === currentPage
                    ? "bg-burgundy-600 text-white"
                    : "border-2 border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
