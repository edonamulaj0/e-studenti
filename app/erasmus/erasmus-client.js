"use client";

import { compareText } from "../lib/directory";
import { matchesSearch } from "../lib/search-text";
import { useT } from "../components/Preferences";
import { useMemo, useState } from "react";
import {
  ExternalLink,
  Search,
  Globe,
} from "lucide-react";

function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

function formatGeneratedAt(iso) {
  // Fixed format: Intl's "sq-AL" output differs between the static build (Node) and the
  // browser, which made React reject the server HTML.
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso || "";
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
  { label: "Austri", flag: "🇦🇹", terms: ["austri", "austria"] },
  { label: "Greqi", flag: "🇬🇷", terms: ["greqi", "greece", "thessaloniki"] },
  { label: "Letoni", flag: "🇱🇻", terms: ["letoni", "latvia", "rigës", "riga"] },
];

function getCountry(item) {
  const title = item.title.toLowerCase();
  return countryMatchers.find((country) =>
    country.terms.some((term) => title.includes(term))
  ) || { label: "Tjetër", flag: "🇪🇺", terms: [] };
}

const COUNTRY_TAIL = /[,\s\-–]*(?:në\s+)?(?:gjermani|itali|turqi|poloni|slloveni|spanjë|francë|portugali|çeki|kroaci|austri|greqi|letoni)\s*$/i;

const titleCase = (text) =>
  text.toLowerCase().replace(/(^|[\s\-–(])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());

/**
 * The institution named in an announcement title, e.g. "Erasmus +, në Universitetin e Gracit, Austri"
 * -> "Universiteti i Gracit". Names in quotes are taken as written; Albanian "Universitetin ..."
 * (accusative) becomes the nominative "Universiteti ...".
 */
export function institutionName(title) {
  let text = String(title || "").replace(/[“”„]/g, '"').replace(/\s+/g, " ").trim();
  const quoted = /në\s+"\s*([^"]+?)\s*"/i.exec(text);
  let name;
  if (quoted) {
    name = quoted[1];
    if (name === name.toUpperCase()) {
      const [head, ...rest] = name.split(" – ");
      name = [titleCase(head).replace(/ Of /g, " of "), ...rest].join(" – ");
    }
  } else {
    const after = /Erasmus\s*\+?\s*,?\s*(?:në|ne)\s+(.+)$/i.exec(text);
    name = (after ? after[1] : text).replace(COUNTRY_TAIL, "").replace(/,\s*$/, "");
    if (name === name.toUpperCase()) name = titleCase(name.replace(/[,\-–]\s*[^,\-–]+$/, ""));
  }
  name = name
    .replace(/\s+,/g, ",")
    .replace(/(^|\s)rë(?=\s|$)/g, "$1të")
    .replace(/^Universitetin\b/i, "Universiteti")
    .replace(/^Universiteti e\b/, "Universiteti i")
    .replace(/^(Universiteti Teknik) të(?=\s)/, "$1 i")
    .replace(/\s-\s/g, " – ")
    .replace(/\bEuropian\b/, "European");
  return name.trim();
}

function getMonth(iso) {
  if (!iso) return "";
  return iso.slice(0, 7);
}

export default function ErasmusClient({ calls: rawCalls, sourceUrl, generatedAt }) {
  const t = useT();
  // One card per institution and link: the source repeats some announcements.
  const calls = useMemo(() => {
    const seen = new Set();
    return rawCalls
      .map((c) => ({ ...c, name: institutionName(c.title) }))
      .filter((c) => {
        const key = `${c.name}|${c.url}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [rawCalls]);
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [month, setMonth] = useState("");

  const countryOptions = useMemo(() => {
    const set = new Set(calls.map((item) => getCountry(item).label));
    return Array.from(set).sort(compareText);
  }, [calls]);

  const monthOptions = useMemo(() => {
    const set = new Set(calls.map((item) => getMonth(item.date)).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [calls]);

  const filtered = useMemo(() => {
    const items = calls.filter((c) => {
      const itemCountry = getCountry(c).label;
      const matchesQuery = matchesSearch(q, c.name, c.title);
      const matchesCountry = !country || itemCountry === country;
      const matchesMonth = !month || getMonth(c.date) === month;
      return matchesQuery && matchesCountry && matchesMonth;
    });
    return items.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [calls, q, country, month]);

  return (
    <div className="page-shell">
      <div className="section-shell">
        <header className="mb-10 max-w-3xl">
          <p className="page-kicker mb-4">
            <Globe className="w-4 h-4" aria-hidden />
            {t("Burim zyrtar: Universiteti i Prishtinës")}
          </p>
          <h1 className="page-title mb-4">
            Erasmus+
          </h1>
          <p
            role="note"
            className="mb-5 max-w-2xl rounded-2xl border border-info-blue/30 bg-info-blue/10 px-4 py-3 text-sm font-semibold text-info-text"
          >
            {t(
              "Kjo faqe është vetëm për Universitetin e Prishtinës (UP). Thirrjet e universiteteve dhe kolegjeve të tjera nuk përfshihen këtu; shihni faqet e tyre zyrtare."
            )}
          </p>
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-500">
            {t("Të dhënat e eksportuara:")}{" "}
            <time dateTime={generatedAt}>{formatGeneratedAt(generatedAt)}</time>
            {sourceUrl && (
              <>
                <span aria-hidden>·</span>
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-burgundy-600 hover:underline"
                >
                  {t("Thirrjet më të reja te faqja e UP")}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              </>
            )}
          </p>
        </header>

        <div className="mb-10">
          <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
            <label className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("Kërko universitet, vend, program...")}
                className="input-srh pl-12"
              />
            </label>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="input-srh">
              <option value="">{t("Të gjitha vendet")}</option>
              {countryOptions.map((item) => (
                <option key={item} value={item}>{t(item)}</option>
              ))}
            </select>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="input-srh">
              <option value="">{t("Të gjitha")}</option>
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
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-burgundy-600/40 hover:shadow-md"
                >
                  <div className="mb-3 flex items-baseline justify-between gap-4 text-xs font-semibold">
                    <span className="text-burgundy-600">{t(destination.label)}</span>
                    {item.date && (
                      <time className="tabular-nums text-gray-500" dateTime={item.date}>
                        {formatDate(item.date)}
                      </time>
                    )}
                  </div>
                  <h2 className="flex-1 font-display text-xl font-bold leading-snug text-navy-900 group-hover:text-burgundy-600">
                    {item.name}
                  </h2>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-burgundy-600">
                    {isListingOnlyUrl(item.url) ? t("Hap listën te UP") : t("Hap thirrjen")}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </a>
              </li>
            );
          })}
        </ul>

        {filtered.length === 0 && (
          <div className="surface-card mx-auto max-w-xl p-10 text-center">
            <Globe className="mx-auto mb-4 h-12 w-12 text-gray-500" />
            <h2 className="text-2xl font-semibold text-navy-900">{t("Nuk u gjet asgjë")}</h2>
            <p className="mt-2 text-gray-600">
              {t("Provoni të ndryshoni kërkimin, vendin ose muajin.")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
