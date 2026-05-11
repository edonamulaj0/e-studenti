"use client";

import { useMemo, useState } from "react";
import {
  ExternalLink,
  Search,
  Globe,
  CalendarDays,
  MapPin,
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

const countryMatchers = [
  { label: "Gjermani", flag: "🇩🇪", terms: ["germany", "gjermani", "deutschland"] },
  { label: "Itali", flag: "🇮🇹", terms: ["italy", "itali", "italia"] },
  { label: "Turqi", flag: "🇹🇷", terms: ["turkey", "turqi", "turkiye", "türkiye"] },
  { label: "Poloni", flag: "🇵🇱", terms: ["poland", "poloni", "polska"] },
  { label: "Slloveni", flag: "🇸🇮", terms: ["slovenia", "slloveni"] },
  { label: "Spanjë", flag: "🇪🇸", terms: ["spain", "spanjë", "espana", "españa"] },
  { label: "Francë", flag: "🇫🇷", terms: ["france", "francë"] },
  { label: "Portugali", flag: "🇵🇹", terms: ["portugal", "portugali"] },
  { label: "Çeki", flag: "🇨🇿", terms: ["czech", "çek", "ceki", "çeki"] },
  { label: "Kroaci", flag: "🇭🇷", terms: ["croatia", "kroaci"] },
];

function getCountry(item) {
  const title = item.title.toLowerCase();
  return countryMatchers.find((country) =>
    country.terms.some((term) => title.includes(term))
  ) || { label: "Tjetër", flag: "🇪🇺", terms: [] };
}

function getMonth(iso) {
  if (!iso) return "";
  return iso.slice(0, 7);
}

export default function ErasmusClient({ calls, sourceUrl, generatedAt }) {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [month, setMonth] = useState("");

  const countryOptions = useMemo(() => {
    const set = new Set(calls.map((item) => getCountry(item).label));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "sq"));
  }, [calls]);

  const monthOptions = useMemo(() => {
    const set = new Set(calls.map((item) => getMonth(item.date)).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [calls]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const items = calls.filter((c) => {
      const itemCountry = getCountry(c).label;
      const matchesSearch = !s || c.title.toLowerCase().includes(s);
      const matchesCountry = !country || itemCountry === country;
      const matchesMonth = !month || getMonth(c.date) === month;
      return matchesSearch && matchesCountry && matchesMonth;
    });
    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [calls, q, country, month]);

  return (
    <div className="page-shell">
      <div className="section-shell">
        <header className="mb-10 max-w-3xl">
          <p className="page-kicker mb-4">
            <Globe className="w-4 h-4" aria-hidden />
            Burim zyrtar: Universiteti i Prishtinës
          </p>
          <h1 className="page-title mb-4">
            Erasmus+
          </h1>
          <p className="page-subtitle mb-5 max-w-2xl">
            Njoftime nga faqja e mundësive të UP që përmbajnë &quot;Erasmus&quot;.
          </p>
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-400">
            Të dhënat e eksportuara:{" "}
            <time dateTime={generatedAt}>{formatGeneratedAt(generatedAt)}</time>
          </p>
        </header>

        <div className="surface-card mb-10 p-4 md:p-5">
          <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
            <label className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Kërko universitet, vend, program..."
                className="input-srh pl-12"
              />
            </label>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="input-srh">
              <option value="">Të gjitha vendet</option>
              {countryOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="input-srh">
              <option value="">Të gjitha</option>
              {monthOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const destination = getCountry(item);
            return (
            <li key={`${item.title}-${item.date}-${item.url}`}>
              <article className="group flex h-full min-h-[18rem] flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-burgundy-600/30 hover:shadow-md">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-navy-100 px-3 py-2 text-navy-900">
                    <CalendarDays className="h-4 w-4 text-burgundy-600" />
                    <time className="text-sm font-bold tabular-nums" dateTime={item.date}>
                      {formatDate(item.date)}
                    </time>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-burgundy-50 px-3 py-1.5 text-sm font-semibold text-burgundy-600">
                    <MapPin className="h-4 w-4" />
                    {destination.flag} {destination.label}
                  </span>
                </div>
                <div className="flex h-full flex-col gap-5">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold leading-snug text-navy-900 transition-colors group-hover:text-burgundy-600">
                      {item.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">
                      Hapni njoftimin zyrtar për detajet e programit, afatet dhe
                      dokumentet e nevojshme.
                    </p>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary self-start"
                  >
                    {isListingOnlyUrl(item.url) ? "Hap listën te UP" : "Hap thirrjen"}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </article>
            </li>
            );
          })}
        </ul>

        {filtered.length === 0 && (
          <div className="surface-card mx-auto max-w-xl p-10 text-center">
            <Globe className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h2 className="text-2xl font-semibold text-navy-900">Nuk u gjet asgjë</h2>
            <p className="mt-2 text-gray-600">
              Provoni të ndryshoni kërkimin, vendin ose muajin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
