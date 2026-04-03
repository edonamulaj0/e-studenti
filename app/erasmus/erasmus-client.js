"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  Search,
  Globe,
  ArrowUpRight,
} from "lucide-react";

function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

function formatGeneratedAt(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("sq-AL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function isListingOnlyUrl(href) {
  try {
    const u = new URL(href);
    const id = decodeURIComponent(u.searchParams.get("id") || "").trim();
    return id === "1,39";
  } catch {
    return true;
  }
}

export default function ErasmusClient({ calls, sourceUrl, generatedAt }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return calls;
    return calls.filter((c) => c.title.toLowerCase().includes(s));
  }, [calls, q]);

  return (
    <div className="pt-24 min-h-screen bg-gradient-to-br from-red-50 to-indigo-100 pb-20">
      <div className="container mx-auto px-4 max-w-4xl py-10 md:py-12">
        <motion.header
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12 md:mb-14 max-w-3xl mx-auto"
        >

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-4">
            Erasmus+
          </h1>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-5 py-2 text-sm font-semibold text-red-700 shadow-md border border-red-100 mb-6">
            <Globe className="w-4 h-4" aria-hidden />
            Burim zyrtar: Universiteti i Prishtinës
          </div>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
            Njoftime nga faqja e mundësive të UP që përmbajnë &quot;Erasmus&quot;.
          </p>
          <p className="text-sm text-gray-500 flex flex-col items-center gap-2 max-w-xl mx-auto">
            <span className="flex flex-wrap items-center justify-center gap-2">
              Të dhënat e eksportuara:{" "}
              <time dateTime={generatedAt}>{formatGeneratedAt(generatedAt)}</time>
            </span>
          </p>
        </motion.header>

        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
          className="relative mb-10"
        >
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kërko në tituj…"
            className="w-full pl-14 pr-5 py-4 text-lg rounded-2xl border-2 border-gray-200 bg-white shadow-lg focus:border-red-500 focus:ring-4 focus:ring-red-500/15 outline-none transition-all"
          />
        </motion.div>

        <ul className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, i) => (
              <motion.li
                key={`${item.title}-${item.date}-${item.url}`}
                layout
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{
                  duration: 0.35,
                  delay: Math.min(i * 0.02, 0.24),
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <article className="group rounded-2xl bg-white border-2 border-transparent hover:border-red-200 shadow-md hover:shadow-xl p-6 md:p-8 transition-all duration-300">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <time
                        className="text-base font-bold text-red-600 tabular-nums"
                        dateTime={item.date}
                      >
                        {formatDate(item.date)}
                      </time>
                      <h2 className="mt-2 text-xl md:text-2xl font-bold text-gray-900 leading-snug group-hover:text-red-800 transition-colors">
                        {item.title}
                      </h2>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white px-6 py-3.5 text-lg font-semibold hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-600/25 transition-all shrink-0 w-full md:w-auto"
                    >
                      {isListingOnlyUrl(item.url)
                        ? "Hap listën te UP"
                        : "Hap thirrjen"}
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </article>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        {filtered.length === 0 && (
          <p className="text-center text-xl text-gray-500 py-16">
            Nuk u gjet asgjë për &quot;{q}&quot;.
          </p>
        )}
      </div>
    </div>
  );
}
