"use client";

import { useState, useMemo, useEffect } from "react";
import {
  FileText,
  Download,
  Eye,
  Filter,
  Search,
  Archive,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ArchiveModal from "../components/ArchiveModal";

function typeSectionId(type) {
  return `mat-section-${encodeURIComponent(type)}`;
}

export default function MaterialsClient({ initialMaterials }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [activeSection, setActiveSection] = useState(null);

  const typeOptions = useMemo(() => {
    const set = new Set(initialMaterials.map((m) => m.type).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "sq"));
  }, [initialMaterials]);

  const { filteredMaterials, typeCounts } = useMemo(() => {
    const q = searchTerm.toLowerCase();
    const matchSF = (material) => {
      const matchesSearch =
        material.title.toLowerCase().includes(q) ||
        material.subject.toLowerCase().includes(q) ||
        material.teacher.toLowerCase().includes(q);
      const matchesFaculty =
        selectedFaculty === "" || material.faculty === selectedFaculty;
      return matchesSearch && matchesFaculty;
    };

    const counts = {};
    for (const m of initialMaterials) {
      if (!matchSF(m)) continue;
      const t = m.type || "Të pa klasifikuara";
      counts[t] = (counts[t] || 0) + 1;
    }

    const filtered = initialMaterials.filter(
      (material) =>
        matchSF(material) &&
        (selectedType === "" || material.type === selectedType)
    );

    return { filteredMaterials: filtered, typeCounts: counts };
  }, [initialMaterials, searchTerm, selectedFaculty, selectedType]);

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
  };

  const isArchiveFile = (fileType) => {
    return (
      fileType?.toLowerCase() === "zip" || fileType?.toLowerCase() === "rar"
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
    <motion.div
      key={material.id}
      layout
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white rounded-2xl shadow-lg p-7 md:p-8 hover:shadow-2xl border-2 border-transparent hover:border-red-100 flex flex-col transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between mb-5 gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 leading-snug">
            {material.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-base text-gray-600">
            <span className="bg-red-100 text-red-900 px-3 py-1 rounded-full font-semibold">
              {material.faculty}
            </span>
            <span className="text-gray-500">{material.department}</span>
          </div>
        </div>
        <FileText className="w-10 h-10 text-red-600 shrink-0" />
      </div>

      <div className="space-y-3 mb-6 flex-1 text-lg">
        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Lënda:</span>
          <span className="font-semibold text-right">{material.subject}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Lloji:</span>
          <span className="font-semibold text-right">{material.type}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Autor/e:</span>
          <span className="font-semibold text-right">{material.teacher}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-auto">
        {material.r2Url && (
          <>
            {isArchiveFile(material.fileType) ? (
              <button
                type="button"
                onClick={(e) => handleViewClick(material, e)}
                className="flex-1 min-h-[52px] text-lg font-bold bg-transparent border-2 border-red-600 text-red-600 py-3 px-4 rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                <Archive className="w-5 h-5" />
                Shiko përmbajtjen
              </button>
            ) : (
              <a
                href={material.r2Url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-h-[52px] text-lg font-bold bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/25"
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
              className="flex-1 min-h-[52px] text-lg font-bold bg-gray-700 text-white py-3 px-4 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Shkarko
            </a>
          </>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="pt-24 min-h-screen bg-gradient-to-br from-red-50 to-indigo-100 pb-20">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-5 tracking-tight">
            Materialet
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
            Gjeni shënime, afate dhe projekte — filtroni sipas fakultetit dhe
            seksionit (llojit).
          </p>
        </motion.div>

        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          id="material-filters"
          className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-10 border border-gray-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            <div className="relative md:col-span-2 xl:col-span-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
              <input
                type="text"
                placeholder="Kërko titull, lëndë, autor…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full min-h-[52px] pl-12 pr-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
            </div>

            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="min-h-[52px] px-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500"
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
              className="min-h-[52px] px-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500"
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
              className="min-h-[52px] bg-red-600 text-white px-4 rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 text-lg font-bold shadow-lg shadow-red-600/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Filter className="w-5 h-5" />
              Pastro filtrat
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-base font-bold text-gray-700 flex items-center gap-2 mr-2">
              <Layers className="w-5 h-5 text-red-600" />
              Seksione (lloji):
            </span>
            <button
              type="button"
              onClick={() => setSelectedType("")}
              className={`px-4 py-2.5 rounded-xl text-base font-bold transition-all ${
                selectedType === ""
                  ? "bg-red-600 text-white shadow-md scale-105"
                  : "bg-gray-100 text-gray-800 hover:bg-red-50 hover:text-red-700"
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
                  className={`px-4 py-2.5 rounded-xl text-base font-bold transition-all ${
                    selectedType === t
                      ? "bg-red-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-800 hover:bg-red-50"
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
        </motion.div>

        <div id="material-results" className="scroll-mt-28">
          <AnimatePresence mode="wait">
            {filteredMaterials.length === 0 ? (
              <motion.div
                key="empty"
                initial={false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-24"
              >
                <FileText className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-600 mb-2">
                  Nuk ka të dhëna
                </h3>
                <p className="text-lg text-gray-500">
                  Provoni të ndryshoni kriteret e kërkimit.
                </p>
              </motion.div>
            ) : showGrouped ? (
              <div key="grouped" className="space-y-16">
                {groupedByType.keys.map((type) => (
                  <section
                    key={type}
                    id={typeSectionId(type)}
                    className="min-h-[55vh] scroll-mt-28 pt-4"
                  >
                    <div className="flex items-end justify-between gap-4 mb-8 border-b-4 border-red-200 pb-4">
                      <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                        {type}
                      </h2>
                      <span className="text-lg font-bold text-red-600 shrink-0">
                        {groupedByType.map.get(type).length}{" "}
                        {groupedByType.map.get(type).length === 1
                          ? "material"
                          : "materiale"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {groupedByType.map.get(type).map((m) => renderCard(m))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <motion.div
                key="flat"
                initial={false}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                {filteredMaterials.map((m) => renderCard(m))}
              </motion.div>
            )}
          </AnimatePresence>
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
