import { ANONYMOUS_DISPLAY_NAME } from "./material-privacy.js";

export const RESOURCE_CATEGORIES = [
  "course_site",
  "drive_folder",
  "mega_nz",
  "other",
];

const SHORTENER_HOSTS = new Set([
  "bit.ly",
  "bitly.com",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "rebrand.ly",
  "cutt.ly",
  "shorturl.at",
  "rb.gy",
  "s.id",
  "v.gd",
  "t.ly",
  "lnkd.in",
]);

const BLOCKED_SCHEMES = new Set(["javascript:", "data:", "file:", "vbscript:"]);

export function extractDomain(urlString) {
  try {
    return new URL(urlString).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function isShortenerHost(hostname) {
  const host = String(hostname || "").replace(/^www\./, "").toLowerCase();
  return SHORTENER_HOSTS.has(host);
}

export function validateResourceUrlInput(rawUrl) {
  const trimmed = String(rawUrl || "").trim();
  if (!trimmed) return { ok: false, error: "URL-ja është e detyrueshme." };
  let parsed;
  try {
    parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return { ok: false, error: "URL-ja nuk është e vlefshme." };
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { ok: false, error: "Lejohen vetëm lidhje http/https." };
  }
  if (BLOCKED_SCHEMES.has(parsed.protocol)) {
    return { ok: false, error: "Lloji i URL-së nuk lejohet." };
  }
  return { ok: true, url: parsed.toString() };
}

export async function resolveResourceUrl(rawUrl) {
  const validation = validateResourceUrlInput(rawUrl);
  if (!validation.ok) return validation;

  const originalDomain = extractDomain(validation.url);
  let current = validation.url;
  let wasShortened = isShortenerHost(originalDomain) ? 1 : 0;

  try {
    for (let i = 0; i < 8; i += 1) {
      const res = await fetch(current, {
        method: "GET",
        redirect: "manual",
        headers: { "User-Agent": "E-Studenti-LinkChecker/1.0" },
      });
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("Location");
        if (!location) break;
        current = new URL(location, current).toString();
        if (isShortenerHost(extractDomain(current))) wasShortened = 1;
        continue;
      }
      break;
    }
  } catch {
    return { ok: false, error: "URL-ja nuk mund të verifikohej. Provoni përsëri." };
  }

  const resolvedDomain = extractDomain(current);
  if (!resolvedDomain) {
    return { ok: false, error: "Destinacioni i URL-së nuk u identifikua." };
  }

  return {
    ok: true,
    url: validation.url,
    resolved_url: current,
    resolved_domain: resolvedDomain,
    was_shortened: wasShortened,
  };
}

export async function checkSafeBrowsing(url, env) {
  const apiKey = env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) return { checked: false, matches: [] };

  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: {
            clientId: "e-studenti",
            clientVersion: "1.0.0",
          },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
      }
    );
    if (!res.ok) return { checked: false, matches: [], error: "safe_browsing_unavailable" };
    const data = await res.json().catch(() => ({}));
    const matches = (data.matches || []).map((match) => ({
      threatType: match.threatType,
      platformType: match.platformType,
    }));
    return { checked: true, matches };
  } catch {
    return { checked: false, matches: [], error: "safe_browsing_failed" };
  }
}

export function parseSafetyFlags(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getPublicSubmitterName(link) {
  if (Boolean(link.is_anonymous)) return ANONYMOUS_DISPLAY_NAME;
  return String(link.submitter_name || "").trim();
}

export function sanitizeResourceLinkForPublic(link, { revealSubmitter = false } = {}) {
  if (!link || typeof link !== "object") return link;
  const sanitized = { ...link };
  if (Boolean(link.is_anonymous) && !revealSubmitter) {
    delete sanitized.submitter_name;
    delete sanitized.submitter_surname;
    delete sanitized.submitter_email;
    delete sanitized.user_id;
  } else if (getPublicSubmitterName(link)) {
    sanitized.submitter_name = getPublicSubmitterName(link);
  }
  delete sanitized.safety_flags;
  return sanitized;
}

export function buildResourceSearchClause(q) {
  if (!q) return { clause: null, params: [] };
  return {
    clause:
      "(r.title LIKE ? OR r.description LIKE ? OR r.subject LIKE ? OR r.resolved_domain LIKE ? OR (COALESCE(r.is_anonymous, 0) = 0 AND (u.name LIKE ? OR COALESCE(u.surname, '') LIKE ?)))",
    params: [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`],
  };
}
