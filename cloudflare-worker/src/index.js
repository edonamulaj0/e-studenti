import { unzipSync } from "fflate";
import {
  buildPublicSearchClause,
  materialMatchesPublic,
  materialToPublicLegacyEntry,
  sanitizeMaterialForPublic,
} from "./material-privacy.js";
import { assignMaterialSlugs, findMaterialBySlug } from "./material-slug.js";
import { trackMaterialEvent } from "./material-stats.js";
import { syncModeratorFromEmail, userIsModerator } from "./moderators.js";
import {
  RESOURCE_CATEGORIES,
  buildResourceSearchClause,
  checkSafeBrowsing,
  parseSafetyFlags,
  resolveResourceUrl,
  sanitizeResourceLinkForPublic,
} from "./resource-links.js";
import { loadSiteStats, refreshSiteStats } from "./site-stats.js";

const MEDIA_BASE = "https://media.e-studenti.com";
const DEFAULT_RESEND_FROM = "E-Studenti <onboarding@resend.dev>";
const DEFAULT_ALLOWED_ORIGINS = [
  "https://e-studenti.com",
  "https://www.e-studenti.com",
  "https://e-studenti.pages.dev",
];
const DEFAULT_JWT_ISSUER = "https://e-studenti.com";
const DEFAULT_JWT_AUDIENCE = "https://e-studenti.com";
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_DECOMPRESSED_SIZE = 100 * 1024 * 1024;
const MAX_ZIP_FILES = 500;
const MAX_INDIVIDUAL_ZIP_FILE = 10 * 1024 * 1024;
const CODE_TTL_SECONDS = 15 * 60;   // must stay in sync with upsertVerificationCode
const CODE_COOLDOWN_SECONDS = 60;   // minimum gap between successive sends to the same email

const RATE_LIMITS = {
  register: { requests: 5, window: 3600 },
  login: { requests: 10, window: 900 },
  verify: { requests: 5, window: 900 },
  contact: { requests: 3, window: 3600 },
  upload: { requests: 10, window: 3600 },
  report: { requests: 10, window: 3600 },
  resource_link: { requests: 5, window: 3600 },
  track_view: { requests: 120, window: 3600 },
  track_download: { requests: 120, window: 3600 },
};
const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "zip",
];
const DANGEROUS_EXTENSIONS = [
  "exe",
  "bat",
  "cmd",
  "sh",
  "ps1",
  "msi",
  "dll",
  "vbs",
  "js",
  "jar",
  "py",
  "rb",
  "php",
  "asp",
  "aspx",
];
const MAGIC_BYTES = {
  pdf: [0x25, 0x50, 0x44, 0x46],
  zip: [0x50, 0x4b, 0x03, 0x04],
  ole2: [0xd0, 0xcf, 0x11, 0xe0],
};

const ALWAYS_ALLOWED_EMAIL_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "protonmail.com",
  "proton.me",
  "uni-pr.edu",
];

const DISPOSABLE_EMAIL_DOMAINS = [
  "mailinator.com",
  "10minutemail.com",
  "10minutemail.net",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.biz",
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "yopmail.com",
  "yopmail.fr",
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.net",
  "getnada.com",
  "maildrop.cc",
  "dispostable.com",
  "fakeinbox.com",
  "mintemail.com",
  "mohmal.com",
  "moakt.com",
  "emailondeck.com",
  "sharklasers.com",
  "spam4.me",
  "mailnesia.com",
  "mailcatch.com",
  "mytemp.email",
  "tempinbox.com",
  "burnermail.io",
  "33mail.com",
  "anonaddy.com",
  "simplelogin.io",
  "discard.email",
  "tempr.email",
  "fakemail.net",
  "mailsac.com",
  "inboxkitten.com",
  "tempmailo.com",
  "emailfake.com",
  "crazymailing.com",
  "tempmail.ninja",
  "mail-temp.com",
  "1secmail.com",
  "1secmail.net",
  "1secmail.org",
  "luxusmail.org",
  "rootfest.net",
  "mailbox52.ml",
  "spambox.us",
  "tempmail2.com",
  "throwam.com",
  "kleemail.com",
  "deadaddress.com",
];

function isDisposableEmail(email) {
  const domain = String(email || "").toLowerCase().split("@")[1];
  if (!domain) return true;
  if (ALWAYS_ALLOWED_EMAIL_DOMAINS.includes(domain)) return false;
  if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) return true;
  return false;
}

async function hasMxRecord(domain) {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`,
      {
        headers: { Accept: "application/dns-json" },
        cf: { cacheTtl: 300, cacheEverything: true },
      }
    );
    if (!res.ok) return true; // fail open on HTTP errors
    const data = await res.json();
    if (data.Status === 3) return false; // NXDOMAIN — domain does not exist
    return Array.isArray(data.Answer) && data.Answer.some((r) => r.type === 15);
  } catch {
    return true; // fail open on network errors
  }
}

function getAllowedOrigins(env) {
  const configured = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const devOrigins =
    env.ENVIRONMENT === "production"
      ? []
      : ["http://localhost:3000", "http://127.0.0.1:3000"];
  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured, ...devOrigins])];
}

function isAllowedOrigin(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  return getAllowedOrigins(env).includes(origin);
}

function corsHeaders(request, env) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  const origin = request.headers.get("Origin");
  if (origin && isAllowedOrigin(request, env)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function withCors(response, request, env) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(request, env))) {
    headers.set(key, value);
  }
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function databaseUnavailableResponse() {
  return jsonResponse(
    {
      error:
        "Llogaritë nuk janë aktive për momentin. Materialet publike mund të shfletohen pa hyrje.",
    },
    503
  );
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function verificationCode() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(100000 + (array[0] % 900000));
}

function extFromFilename(name) {
  return String(name || "").split(".").pop()?.toLowerCase() || "";
}

function sanitizeFilename(name) {
  const cleaned = String(name || "material")
    .replace(/[/\\]/g, "-")
    .replace(/[^a-zA-Z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
  return cleaned || "material";
}

function keyToPublicUrl(key) {
  return `${MEDIA_BASE}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

function extFromKey(key) {
  return String(key || "").split(".").pop()?.toLowerCase() || "";
}

function titleFromKey(key) {
  const filename = String(key || "Material")
    .split("/")
    .pop()
    ?.replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  return filename || "Material";
}

function normalizeUploaderName(name) {
  const value = String(name || "").trim();
  return value;
}

async function listAllR2Objects(bucket) {
  const objects = [];
  let cursor;
  do {
    const page = await bucket.list({ cursor });
    objects.push(...(page.objects || []));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return objects;
}

function extractMetadataRecords(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  for (const key of ["materials", "entries", "files", "items", "objects", "data"]) {
    if (Array.isArray(value[key])) return value[key];
  }
  return [value];
}

function normalizeR2Material(record, fallbackKey, index = 0) {
  const fileKey =
    record.file_key ||
    record.fileKey ||
    record.key ||
    record.objectKey ||
    record.path ||
    fallbackKey;
  const r2Url =
    record.r2_url ||
    record.r2Url ||
    record.publicUrl ||
    record.downloadUrl ||
    record.url ||
    (fileKey ? keyToPublicUrl(fileKey) : "");
  const uploaderName = normalizeUploaderName(
    record.uploader_name ||
    record.uploaderName ||
    record.submittedBy?.name ||
    record.contributor ||
    record.author ||
    ""
  );
  const material = {
    id: record.id || fileKey || `r2-${index}`,
    title: record.title || record.name || titleFromKey(fileKey),
    faculty: String(record.faculty || record.facultyCode || "//").toUpperCase(),
    department: record.department || record.program || "//",
    subject: record.subject || record.course || "//",
    teacher: record.teacher || record.professor || "//",
    type: record.type || record.category || "Të tjera",
    file_key: fileKey || "",
    file_type: record.file_type || record.fileType || extFromKey(fileKey),
    file_size: record.file_size || record.fileSize || record.size || null,
    r2_url: r2Url,
    uploader_name: uploaderName,
    created_at: record.created_at || record.createdAt || record.uploadedAt || "",
    updated_at: record.updated_at || record.updatedAt || "",
  };
  return material;
}

function isPublicMaterial(material) {
  return String(material.file_type || material.fileType || "")
    .toLowerCase()
    .trim() !== "rar";
}

async function loadR2Materials(env) {
  if (!env.METADATA_BUCKET) return [];
  const objects = await listAllR2Objects(env.METADATA_BUCKET);
  const materials = [];
  for (const object of objects) {
    if (!object.key || object.key.endsWith("/")) continue;
    if (object.size && object.size > 10 * 1024 * 1024) continue;
    const body = await env.METADATA_BUCKET.get(object.key);
    if (!body) continue;
    try {
      const parsed = await body.json();
      extractMetadataRecords(parsed).forEach((record, index) => {
        if (record && typeof record === "object") {
          const material = normalizeR2Material(record, object.key, materials.length + index);
          if (isPublicMaterial(material)) materials.push(material);
        }
      });
    } catch {
      // Ignore non-JSON or malformed metadata objects so one bad file does not break rendering.
    }
  }
  return materials;
}

function materialMatches(material, filters) {
  return materialMatchesPublic(material, filters);
}

function materialSort(a, b) {
  if (a.created_at || b.created_at) {
    return String(b.created_at || "").localeCompare(String(a.created_at || ""));
  }
  return String(a.title).localeCompare(String(b.title), "sq");
}

function materialSortBy(sort) {
  if (sort === "views") {
    return (a, b) =>
      Number(b.view_count || 0) - Number(a.view_count || 0) ||
      String(b.created_at || "").localeCompare(String(a.created_at || ""));
  }
  if (sort === "downloads") {
    return (a, b) =>
      Number(b.download_count || 0) - Number(a.download_count || 0) ||
      String(b.created_at || "").localeCompare(String(a.created_at || ""));
  }
  return materialSort;
}

function publicUrlToKey(url) {
  try {
    return decodeURIComponent(new URL(url).pathname.replace(/^\//, ""));
  } catch {
    return "";
  }
}

function materialDedupeKey(material) {
  const key =
    material.file_key ||
    material.fileKey ||
    publicUrlToKey(material.r2_url || material.r2Url);
  if (!key) return "";
  return String(key).trim().toLowerCase();
}

function mergePublicMaterials(dbMaterials, r2Materials) {
  const seenFiles = new Set();
  const usedIds = new Set();
  const merged = [];

  for (const [source, materials] of [
    ["db", dbMaterials],
    ["r2", r2Materials],
  ]) {
    for (const material of materials) {
      const dedupeKey = materialDedupeKey(material);
      if (dedupeKey) {
        if (seenFiles.has(dedupeKey)) continue;
        seenFiles.add(dedupeKey);
      }

      const id = material.id || material.file_key || material.r2_url || `${source}-${merged.length}`;
      const idKey = String(id);
      const publicMaterial = usedIds.has(idKey)
        ? { ...material, id: `${source}:${idKey}` }
        : material;
      usedIds.add(String(publicMaterial.id));
      merged.push(publicMaterial);
    }
  }

  return merged;
}

function paginatedMaterialsResponse(allMaterials, { faculty, type, q, studyLevel, page, limit, sort }) {
  const offset = (page - 1) * limit;
  const baseFiltered = allMaterials.filter((material) =>
    materialMatches(material, { faculty, q, studyLevel })
  );
  const typeCounts = {};
  for (const material of baseFiltered) {
    const key = material.type || "Të pa klasifikuara";
    typeCounts[key] = (typeCounts[key] || 0) + 1;
  }
  const filtered = baseFiltered
    .filter((material) => materialMatches(material, { type }))
    .sort(materialSortBy(sort));
  const pageSlice = filtered.slice(offset, offset + limit);
  const materials = pageSlice.map((material) => sanitizeMaterialForPublic(material));

  return jsonResponse({
    materials,
    entries: pageSlice.map((material) =>
      materialToPublicLegacyEntry(material, normalizeUploaderName)
    ),
    typeCounts,
    pagination: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
      hasNextPage: offset + pageSlice.length < filtered.length,
    },
  });
}

function base64UrlEncode(value) {
  const string =
    typeof value === "string" ? value : String.fromCharCode(...new Uint8Array(value));
  return btoa(string).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlEncodeJson(value) {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));
}

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "="
  );
  return atob(padded);
}

function getJwtIssuer(env) {
  return env.JWT_ISSUER || DEFAULT_JWT_ISSUER;
}

function getJwtAudience(env) {
  return env.JWT_AUDIENCE || DEFAULT_JWT_AUDIENCE;
}

async function signJWT(payload, env) {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    ...payload,
    iss: getJwtIssuer(env),
    aud: getJwtAudience(env),
    iat: now,
    exp: now + 30 * 24 * 60 * 60,
  };
  const header = base64UrlEncodeJson({ alg: "HS256", typ: "JWT" });
  const body = base64UrlEncodeJson(claims);
  const data = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const sigB64 = base64UrlEncode(sig);
  return `${data}.${sigB64}`;
}

async function verifyJWT(token, env) {
  try {
    const [header, body, sig] = token.split(".");
    if (!header || !body || !sig) return null;
    const parsedHeader = JSON.parse(base64UrlDecode(header));
    if (parsedHeader.alg !== "HS256" || parsedHeader.typ !== "JWT") return null;
    const data = `${header}.${body}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(env.JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = Uint8Array.from(base64UrlDecode(sig), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(data)
    );
    if (!valid) return null;
    const payload = JSON.parse(base64UrlDecode(body));
    const now = Math.floor(Date.now() / 1000);
    if (payload.iss !== getJwtIssuer(env) || payload.aud !== getJwtAudience(env)) {
      return null;
    }
    if (!payload.exp || payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}

async function getUserFromRequest(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)srh_token=([^;]+)/);
  if (!match) return null;
  const payload = await verifyJWT(match[1], env);
  if (!payload) return null;
  const userId = payload.sub || payload.userId;
  const user = await env.DB.prepare(
    "SELECT * FROM users WHERE id = ? AND email_verified = 1"
  )
    .bind(userId)
    .first();
  if (!user) return null;
  await syncModeratorFromEmail(user, env);
  user.is_moderator = userIsModerator(user, env) ? 1 : 0;
  return user;
}

async function sendEmail(to, subject, html, env, from = env.RESEND_FROM || DEFAULT_RESEND_FROM) {
  if (!env.RESEND_API_KEY) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    console.error("Resend email failed", await res.text().catch(() => ""));
  }
  return res.ok;
}

function codeEmailHtml(code) {
  return `
    <div style="margin:0;background:#fdfbf7;padding:32px 16px;font-family:Inter,Arial,sans-serif;color:#1a2332;line-height:1.6">
      <div style="margin:0 auto;max-width:520px;border-radius:24px;background:#ffffff;padding:32px;border:1px solid #e2e8f0">
        <p style="margin:0 0 12px;text-transform:uppercase;letter-spacing:0.14em;font-size:12px;font-weight:700;color:#8B3A3A">E-Studenti</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#1a2332">Kodi juaj i verifikimit</h1>
        <p style="margin:0 0 20px;color:#4a5568">Përdoreni këtë kod për të përfunduar hyrjen ose regjistrimin në E-Studenti.</p>
        <p style="margin:0 0 20px;border-radius:18px;background:#fef5f5;padding:18px;text-align:center">
          <strong style="font-size:34px;letter-spacing:8px;color:#8B3A3A">${escapeHtml(code)}</strong>
        </p>
        <p style="margin:0;color:#4a5568">Ky kod skadon në 15 minuta. Nëse nuk e kërkuat ju këtë kod, mund ta injoroni këtë email.</p>
      </div>
    </div>
  `;
}

function hexFromBuffer(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashVerificationCode(email, code, env) {
  const data = new TextEncoder().encode(`${normalizeEmail(email)}:${code}:${env.JWT_SECRET}`);
  return hexFromBuffer(await crypto.subtle.digest("SHA-256", data));
}

function timingSafeEqual(left, right) {
  const a = String(left || "");
  const b = String(right || "");
  let diff = a.length ^ b.length;
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

async function ensureRateLimitTable(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      reset_at INTEGER NOT NULL
    )`
  ).run();
}

async function ensureContactMessagesTable(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`
  ).run();
}

async function ensureReportsTable(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      reporter_id INTEGER,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    )`
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_reports_material ON reports(material_id)"
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status)"
  ).run();
}

function rateLimitIdentity(request) {
  const forwardedFor = request.headers.get("X-Forwarded-For") || "";
  return (
    request.headers.get("CF-Connecting-IP") ||
    forwardedFor.split(",")[0]?.trim() ||
    "unknown"
  );
}

async function checkRateLimit(request, action, env) {
  const config = RATE_LIMITS[action];
  if (!config || !env.DB) return null;

  const now = Math.floor(Date.now() / 1000);
  const key = `${action}:${rateLimitIdentity(request)}`;

  try {
    let row = await env.DB.prepare("SELECT count, reset_at FROM rate_limits WHERE key=?")
      .bind(key)
      .first();

    if (!row) {
      await env.DB.prepare("INSERT INTO rate_limits (key, count, reset_at) VALUES (?,?,?)")
        .bind(key, 1, now + config.window)
        .run();
      return null;
    }

    if (Number(row.reset_at) <= now) {
      await env.DB.prepare("UPDATE rate_limits SET count=?, reset_at=? WHERE key=?")
        .bind(1, now + config.window, key)
        .run();
      return null;
    }

    if (Number(row.count) >= config.requests) {
      return jsonResponse(
        {
          error: "Shumë kërkesa. Provoni përsëri më vonë.",
          retryAfter: Number(row.reset_at) - now,
        },
        429
      );
    }

    await env.DB.prepare("UPDATE rate_limits SET count=count+1 WHERE key=?").bind(key).run();
    return null;
  } catch (error) {
    if (String(error.message || error).includes("no such table")) {
      await ensureRateLimitTable(env);
      return checkRateLimit(request, action, env);
    }
    throw error;
  }
}

function readUInt16LE(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUInt32LE(bytes, offset) {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
}

function validateZipDirectory(bytes) {
  let eocdOffset = -1;
  const minOffset = Math.max(0, bytes.length - 65557);
  for (let offset = bytes.length - 22; offset >= minOffset; offset -= 1) {
    if (readUInt32LE(bytes, offset) === 0x06054b50) {
      eocdOffset = offset;
      break;
    }
  }
  if (eocdOffset === -1) {
    return { ok: false, error: "ZIP nuk është i vlefshëm." };
  }

  const entryCount = readUInt16LE(bytes, eocdOffset + 10);
  const centralDirectoryOffset = readUInt32LE(bytes, eocdOffset + 16);
  if (entryCount > MAX_ZIP_FILES) {
    return { ok: false, error: "ZIP ka shumë skedarë." };
  }

  let offset = centralDirectoryOffset;
  let totalSize = 0;
  let fileCount = 0;
  for (let i = 0; i < entryCount; i += 1) {
    if (readUInt32LE(bytes, offset) !== 0x02014b50) {
      return { ok: false, error: "ZIP nuk mund të lexohet sigurt." };
    }
    const uncompressedSize = readUInt32LE(bytes, offset + 24);
    const fileNameLength = readUInt16LE(bytes, offset + 28);
    const extraLength = readUInt16LE(bytes, offset + 30);
    const commentLength = readUInt16LE(bytes, offset + 32);
    const filename = new TextDecoder().decode(
      bytes.slice(offset + 46, offset + 46 + fileNameLength)
    );

    if (!filename.endsWith("/")) {
      if (uncompressedSize === 0xffffffff) {
        return { ok: false, error: "ZIP64 nuk lejohet për ngarkime." };
      }
      fileCount += 1;
      totalSize += uncompressedSize;
      if (uncompressedSize > MAX_INDIVIDUAL_ZIP_FILE) {
        return { ok: false, error: "ZIP përmban skedar shumë të madh." };
      }
      if (totalSize > MAX_DECOMPRESSED_SIZE) {
        return { ok: false, error: "ZIP tejkalon madhësinë e lejuar pas hapjes." };
      }
      if (fileCount > MAX_ZIP_FILES) {
        return { ok: false, error: "ZIP ka shumë skedarë." };
      }
      const innerExt = filename.split(".").pop()?.toLowerCase();
      if (DANGEROUS_EXTENSIONS.includes(innerExt)) {
        return { ok: false, error: `ZIP përmban skedar të ndaluar: .${innerExt}` };
      }
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return { ok: true };
}

async function validateFile(file, ext) {
  if (file.size > MAX_FILE_SIZE) return { ok: false, error: "Skedari tejkalon 50MB." };
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      ok: false,
      error: `Lloji i skedarit nuk lejohet. Lejohen: ${ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const isPDF = MAGIC_BYTES.pdf.every((b, i) => bytes[i] === b);
  const isZIP = MAGIC_BYTES.zip.every((b, i) => bytes[i] === b);
  const isOLE2 = MAGIC_BYTES.ole2.every((b, i) => bytes[i] === b);
  const zipBased = ["zip", "docx", "xlsx", "pptx"];
  const ole2Based = ["doc", "xls", "ppt"];

  if (ext === "pdf" && !isPDF) {
    return { ok: false, error: "Skedari nuk është PDF i vlefshëm." };
  }
  if (zipBased.includes(ext) && !isZIP) {
    return { ok: false, error: "Skedari nuk është i vlefshëm." };
  }
  if (ole2Based.includes(ext) && !isOLE2) {
    return { ok: false, error: "Skedari nuk është i vlefshëm." };
  }

  if (ext === "zip") {
    try {
      const fullBuffer = await file.arrayBuffer();
      const zipDirectory = validateZipDirectory(new Uint8Array(fullBuffer));
      if (!zipDirectory.ok) return zipDirectory;
      const unzipped = unzipSync(new Uint8Array(fullBuffer));
      for (const filename of Object.keys(unzipped)) {
        const innerExt = filename.split(".").pop()?.toLowerCase();
        if (DANGEROUS_EXTENSIONS.includes(innerExt)) {
          return { ok: false, error: `ZIP përmban skedar të ndaluar: .${innerExt}` };
        }
      }
    } catch {
      return { ok: false, error: "Nuk mund të skanohej skedari ZIP." };
    }
  }

  return { ok: true };
}

async function checkCodeCooldown(email, env) {
  const row = await env.DB.prepare(
    "SELECT expires_at FROM verification_codes WHERE email = ?"
  )
    .bind(email)
    .first();
  if (!row) return null;
  const expiresAt = new Date(row.expires_at).getTime() / 1000;
  const sentAt = expiresAt - CODE_TTL_SECONDS;
  const retryAfter = Math.ceil(sentAt + CODE_COOLDOWN_SECONDS - Date.now() / 1000);
  return retryAfter > 0 ? retryAfter : null;
}

async function upsertVerificationCode(email, env) {
  const code = verificationCode();
  const hashedCode = await hashVerificationCode(email, code, env);
  const expiresAt = new Date(Date.now() + CODE_TTL_SECONDS * 1000).toISOString();
  await env.DB.prepare(
    "INSERT OR REPLACE INTO verification_codes (email, code, expires_at) VALUES (?,?,?)"
  )
    .bind(email, hashedCode, expiresAt)
    .run();
  return code;
}

async function handleRegister(request, env) {
  if (!env.DB) return databaseUnavailableResponse();
  const limited = await checkRateLimit(request, "register", env);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const surname = String(body.surname || "").trim();
  const email = normalizeEmail(body.email);

  if (!name || !surname || !email || !isValidEmail(email)) {
    return jsonResponse({ error: "Plotësoni emrin, mbiemrin dhe emailin e vlefshëm." }, 400);
  }

  if (isDisposableEmail(email)) {
    return jsonResponse(
      {
        error:
          "Nuk mund të krijoni llogari me email të përkohshëm. Ju lutem përdorni Gmail, Outlook, ProtonMail ose email-in tuaj universitar (@uni-pr.edu).",
      },
      400
    );
  }

  // For domains not on the always-allowed list, verify they actually have MX records.
  // This blocks invented/nonexistent domains (e.g. jkgsjdg@gjksd.com) that slip past
  // the static blocklist.
  const emailDomain = email.split("@")[1];
  if (!ALWAYS_ALLOWED_EMAIL_DOMAINS.includes(emailDomain)) {
    const mxOk = await hasMxRecord(emailDomain);
    if (!mxOk) {
      return jsonResponse(
        {
          error:
            "Domeni i emailit nuk pranon mesazhe. Ju lutem përdorni një adresë email të vlefshme.",
        },
        400
      );
    }
  }

  const existing = await env.DB.prepare("SELECT * FROM users WHERE email = ?")
    .bind(email)
    .first();
  if (existing?.email_verified) {
    return jsonResponse({ error: "Ky email është i regjistruar." }, 400);
  }

  await env.DB.prepare(
    "INSERT OR IGNORE INTO users (name, surname, email) VALUES (?,?,?)"
  )
    .bind(name, surname, email)
    .run();
  await env.DB.prepare(
    "UPDATE users SET name=?, surname=? WHERE email=? AND email_verified=0"
  )
    .bind(name, surname, email)
    .run();

  const cooldown = await checkCodeCooldown(email, env);
  if (cooldown !== null) {
    return jsonResponse(
      { error: `Ju lutemi prisni ${cooldown}s para se të dërgoni kodin përsëri.`, retryAfter: cooldown },
      429
    );
  }

  const code = await upsertVerificationCode(email, env);
  const sent = await sendEmail(
    email,
    "Kodi i verifikimit — E-Studenti",
    codeEmailHtml(code),
    env,
    env.RESEND_VERIFY_FROM || env.RESEND_FROM || DEFAULT_RESEND_FROM
  );
  if (!sent) return jsonResponse({ error: "Emaili nuk mund të dërgohej." }, 502);

  return jsonResponse({ success: true, message: "Kodi u dërgua në emailin tuaj." });
}

async function handleVerify(request, env) {
  if (!env.DB) return databaseUnavailableResponse();
  const limited = await checkRateLimit(request, "verify", env);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const code = String(body.code || "").trim();
  if (!email || !code) return jsonResponse({ error: "Emaili dhe kodi kërkohen." }, 400);

  const row = await env.DB.prepare("SELECT * FROM verification_codes WHERE email=?")
    .bind(email)
    .first();
  if (!row) return jsonResponse({ error: "Kodi nuk u gjet. Provoni përsëri." }, 400);
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await env.DB.prepare("DELETE FROM verification_codes WHERE email=?").bind(email).run();
    return jsonResponse({ error: "Kodi ka skaduar. Provoni përsëri." }, 400);
  }
  const hashedCode = await hashVerificationCode(email, code, env);
  if (!timingSafeEqual(row.code, hashedCode)) {
    return jsonResponse({ error: "Kodi nuk është i saktë." }, 400);
  }

  await env.DB.prepare("DELETE FROM verification_codes WHERE email=?").bind(email).run();
  await env.DB.prepare("UPDATE users SET email_verified=1 WHERE email=?").bind(email).run();
  let user = await env.DB.prepare("SELECT * FROM users WHERE email=?").bind(email).first();
  user = await syncModeratorFromEmail(user, env);
  user.is_moderator = userIsModerator(user, env) ? 1 : 0;

  // Claim any legacy materials whose pending_owner_email matches this user.
  // Runs on every verification but is a no-op for the vast majority (0 rows matched).
  let linkedMaterialsCount = 0;
  try {
    const linkResult = await env.DB.prepare(
      `UPDATE materials
       SET user_id = ?, pending_owner_email = NULL
       WHERE LOWER(pending_owner_email) = LOWER(?) AND user_id IS NULL`
    )
      .bind(user.id, email)
      .run();
    linkedMaterialsCount = linkResult.meta?.changes || 0;
  } catch {
    // pending_owner_email column may not exist yet — non-fatal
  }

  const token = await signJWT({ sub: user.id, email: user.email }, env);

  return new Response(
    JSON.stringify({
      success: true,
      linked_materials_count: linkedMaterialsCount,
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        is_moderator: Boolean(user.is_moderator),
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": `srh_token=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${30 * 24 * 60 * 60}`,
      },
    }
  );
}

async function handleLogin(request, env) {
  if (!env.DB) return databaseUnavailableResponse();
  const limited = await checkRateLimit(request, "login", env);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  if (!email || !isValidEmail(email)) return jsonResponse({ error: "Email i pavlefshëm." }, 400);

  const user = await env.DB.prepare(
    "SELECT * FROM users WHERE email=? AND email_verified=1"
  )
    .bind(email)
    .first();
  if (!user) return jsonResponse({ error: "Email-i nuk është i regjistruar." }, 400);

  const cooldown = await checkCodeCooldown(email, env);
  if (cooldown !== null) {
    return jsonResponse(
      { error: `Ju lutemi prisni ${cooldown}s para se të dërgoni kodin përsëri.`, retryAfter: cooldown },
      429
    );
  }

  const code = await upsertVerificationCode(email, env);
  const sent = await sendEmail(
    email,
    "Kodi i hyrjes — E-Studenti",
    codeEmailHtml(code),
    env,
    env.RESEND_VERIFY_FROM || env.RESEND_FROM || DEFAULT_RESEND_FROM
  );
  if (!sent) return jsonResponse({ error: "Emaili nuk mund të dërgohej." }, 502);

  return jsonResponse({ success: true, message: "Kodi u dërgua në emailin tuaj." });
}

async function handleMe(request, env) {
  if (!env.DB) return databaseUnavailableResponse();
  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
  return jsonResponse({
    user: {
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      is_moderator: userIsModerator(user, env),
    },
  });
}

async function handleReport(request, env) {
  if (!env.DB) return databaseUnavailableResponse();
  const limited = await checkRateLimit(request, "report", env);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const materialId = Number(body.material_id);
  const reason = String(body.reason || "").trim();

  if (!Number.isFinite(materialId) || materialId <= 0) {
    return jsonResponse({ error: "ID i materialit nuk është i vlefshëm." }, 400);
  }
  if (!reason) {
    return jsonResponse({ error: "Arsyeja e raportimit kërkohet." }, 400);
  }
  if (reason.length > 500) {
    return jsonResponse({ error: "Arsyeja është shumë e gjatë." }, 400);
  }

  const material = await env.DB.prepare(
    "SELECT id FROM materials WHERE id = ?"
  )
    .bind(materialId)
    .first();
  if (!material) {
    return jsonResponse({ error: "Materiali nuk ekziston." }, 404);
  }

  const reporter = await getUserFromRequest(request, env);
  const reporterId = reporter ? reporter.id : null;

  try {
    await env.DB.prepare(
      "INSERT INTO reports (material_id, reporter_id, reason) VALUES (?, ?, ?)"
    )
      .bind(materialId, reporterId, reason)
      .run();
  } catch (error) {
    if (String(error.message || error).includes("no such table")) {
      await ensureReportsTable(env);
      await env.DB.prepare(
        "INSERT INTO reports (material_id, reporter_id, reason) VALUES (?, ?, ?)"
      )
        .bind(materialId, reporterId, reason)
        .run();
    } else {
      throw error;
    }
  }

  return jsonResponse({ success: true });
}

async function handleReports(request, env) {
  if (!env.DB) return databaseUnavailableResponse();
  const user = await getUserFromRequest(request, env);
  if (!user || !userIsModerator(user, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const result = await env.DB.prepare(
    `SELECT
       r.id, r.reason, r.status, r.created_at,
       m.id    AS material_id,
       m.title AS material_title,
       m.faculty AS material_faculty,
       m.subject AS material_subject,
       m.r2_url  AS material_url,
       m.file_type AS material_file_type,
       u.name    AS reporter_name,
       u.surname AS reporter_surname,
       u.email   AS reporter_email
     FROM reports r
     JOIN materials m ON r.material_id = m.id
     LEFT JOIN users u ON r.reporter_id = u.id
     WHERE r.status = 'pending'
     ORDER BY r.created_at DESC`
  ).all();

  return jsonResponse({ reports: result.results || [] });
}

async function handleResolveReport(request, env) {
  if (!env.DB) return databaseUnavailableResponse();
  const user = await getUserFromRequest(request, env);
  if (!user || !userIsModerator(user, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const body = await request.json().catch(() => ({}));
  const reportId = Number(body.report_id);
  const action = String(body.action || "");

  if (!Number.isFinite(reportId) || reportId <= 0) {
    return jsonResponse({ error: "ID i raportit nuk është i vlefshëm." }, 400);
  }
  if (!["resolve", "dismiss"].includes(action)) {
    return jsonResponse({ error: "Veprimi nuk është i vlefshëm." }, 400);
  }

  const status = action === "resolve" ? "resolved" : "dismissed";
  const result = await env.DB.prepare("UPDATE reports SET status = ? WHERE id = ? AND status = 'pending'")
    .bind(status, reportId)
    .run();

  if (!result.meta.changes) {
    return jsonResponse({ error: "Raporti nuk u gjet ose është trajtuar tashmë." }, 404);
  }
  return jsonResponse({ success: true });
}

function handleLogout() {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": "srh_token=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0",
    },
  });
}

async function loadD1Materials(env) {
  if (!env.DB) return [];
  try {
    const result = await env.DB.prepare(
      `SELECT m.*, TRIM(COALESCE(u.name, '') || ' ' || COALESCE(u.surname, '')) as uploader_name
       FROM materials m JOIN users u ON m.user_id = u.id
       WHERE LOWER(COALESCE(m.file_type, '')) != 'rar'`
    ).all();
    return result.results || [];
  } catch (error) {
    console.error("Unable to load D1 materials for public catalog", error);
    return [];
  }
}

async function handleMaterials(request, url, env) {
  const faculty = url.searchParams.get("faculty");
  const type = url.searchParams.get("type");
  const q = url.searchParams.get("q") || url.searchParams.get("search");
  const studyLevel = url.searchParams.get("niveli") || url.searchParams.get("study_level");
  const userFilter = url.searchParams.get("user");
  const sortParam = url.searchParams.get("sort") || "newest";
  const sort = ["views", "downloads"].includes(sortParam) ? sortParam : "newest";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const requestedLimit = Number(url.searchParams.get("limit")) || 50;
  const limit = Math.min(100, Math.max(1, requestedLimit));
  const offset = (page - 1) * limit;

  if (env.METADATA_BUCKET && userFilter !== "me") {
    const [dbMaterials, r2Materials] = await Promise.all([
      loadD1Materials(env),
      loadR2Materials(env),
    ]);
    return paginatedMaterialsResponse(mergePublicMaterials(dbMaterials, r2Materials), {
      faculty,
      type,
      q,
      studyLevel,
      page,
      limit,
      sort,
    });
  }

  if (!env.DB) {
    if (userFilter === "me") return jsonResponse({ error: "Unauthorized" }, 401);
    return jsonResponse({
      materials: [],
      entries: [],
      typeCounts: {},
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
      },
    });
  }

  const baseParams = [];
  const baseWhere = ["LOWER(COALESCE(m.file_type, '')) != 'rar'"];

  if (faculty) {
    baseWhere.push("m.faculty = ?");
    baseParams.push(faculty.toUpperCase());
  }
  if (q) {
    const search = buildPublicSearchClause(q);
    baseWhere.push(search.clause);
    baseParams.push(...search.params);
  }
  if (studyLevel && ["bachelor", "master", "phd"].includes(studyLevel)) {
    baseWhere.push("COALESCE(m.study_level, 'bachelor') = ?");
    baseParams.push(studyLevel);
  }
  if (userFilter === "me") {
    const user = await getUserFromRequest(request, env);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
    baseWhere.push("m.user_id = ?");
    baseParams.push(user.id);
  }

  const where = [...baseWhere];
  const params = [...baseParams];
  if (type) {
    where.push("m.type = ?");
    params.push(type);
  }

  const countStatement = env.DB.prepare(
    `SELECT COUNT(*) as total
     FROM materials m JOIN users u ON m.user_id = u.id
     WHERE ${where.join(" AND ")}`
  );
  const countResult = params.length
    ? await countStatement.bind(...params).first()
    : await countStatement.first();
  const total = Number(countResult?.total || 0);

  const typeCountsStatement = env.DB.prepare(
    `SELECT m.type, COUNT(*) as count
     FROM materials m JOIN users u ON m.user_id = u.id
     WHERE ${baseWhere.join(" AND ")}
     GROUP BY m.type
     ORDER BY m.type ASC`
  );
  const typeCountsResult = baseParams.length
    ? await typeCountsStatement.bind(...baseParams).all()
    : await typeCountsStatement.all();
  const typeCounts = {};
  for (const row of typeCountsResult.results || []) {
    typeCounts[row.type || "Të pa klasifikuara"] = Number(row.count || 0);
  }

  const orderBy =
    sort === "views"
      ? "m.view_count DESC, m.created_at DESC"
      : sort === "downloads"
        ? "m.download_count DESC, m.created_at DESC"
        : "m.created_at DESC";

  const statement = env.DB.prepare(
    `SELECT m.*, TRIM(COALESCE(u.name, '') || ' ' || COALESCE(u.surname, '')) as uploader_name
     FROM materials m JOIN users u ON m.user_id = u.id
     WHERE ${where.join(" AND ")}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`
  );
  const result = await statement.bind(...params, limit, offset).all();

  const rawMaterials = result.results || [];
  const isOwnerView = userFilter === "me";
  const materials = isOwnerView
    ? rawMaterials
    : rawMaterials.map((material) => sanitizeMaterialForPublic(material));
  return jsonResponse({
    materials,
    entries: rawMaterials.map((material) =>
      isOwnerView
        ? materialToLegacyEntry(material)
        : materialToPublicLegacyEntry(material, normalizeUploaderName)
    ),
    typeCounts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: offset + rawMaterials.length < total,
    },
  });
}

async function handleMaterial(request, url, env) {
  if (!env.DB) return databaseUnavailableResponse();
  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isFinite(id)) return jsonResponse({ error: "ID i pavlefshëm." }, 400);
  const material = await env.DB.prepare(
    `SELECT m.*, TRIM(COALESCE(u.name, '') || ' ' || COALESCE(u.surname, '')) as uploader_name
     FROM materials m JOIN users u ON m.user_id = u.id
     WHERE m.id=?`
  )
    .bind(id)
    .first();
  if (!material || Number(material.user_id) !== Number(user.id)) {
    return jsonResponse({ error: "Nuk keni leje." }, 403);
  }
  return jsonResponse({ material });
}

async function handlePublicMaterial(url, env) {
  const slug = String(url.searchParams.get("slug") || "").trim();
  if (!slug) return jsonResponse({ error: "Slug mungon." }, 400);

  let materials = [];
  if (env.METADATA_BUCKET) {
    const [dbMaterials, r2Materials] = await Promise.all([
      loadD1Materials(env),
      loadR2Materials(env),
    ]);
    materials = mergePublicMaterials(dbMaterials, r2Materials);
  } else if (env.DB) {
    materials = await loadD1Materials(env);
  }

  const match = findMaterialBySlug(materials, slug);
  if (!match) return jsonResponse({ error: "Materiali nuk u gjet." }, 404);

  const material = sanitizeMaterialForPublic(match);
  material.slug = slug;
  return jsonResponse({
    material,
    entry: materialToPublicLegacyEntry(match, normalizeUploaderName),
  });
}

function materialToLegacyEntry(material) {
  return materialToPublicLegacyEntry(material, normalizeUploaderName);
}

async function handleContributors(env) {
  if (env.METADATA_BUCKET) {
    const [dbMaterials, r2Materials] = await Promise.all([
      loadD1Materials(env),
      loadR2Materials(env),
    ]);
    const materials = mergePublicMaterials(dbMaterials, r2Materials);
    const contributors = new Map();
    for (const material of materials) {
      if (material.is_anonymous) continue;
      const name = String(material.uploader_name || "").trim();
      if (!name) continue;
      const current = contributors.get(name) || {
        name,
        surname: "",
        created_at: material.created_at || "",
        material_count: 0,
        faculty: material.faculty || "",
      };
      current.material_count += 1;
      if (!current.faculty && material.faculty) current.faculty = material.faculty;
      contributors.set(name, current);
    }
    return jsonResponse({
      contributors: Array.from(contributors.values()).sort((a, b) => {
        const countDiff = Number(b.material_count || 0) - Number(a.material_count || 0);
        if (countDiff !== 0) return countDiff;
        return String(a.name || "").localeCompare(String(b.name || ""), "sq");
      }),
    });
  }

  if (!env.DB) {
    return jsonResponse({ contributors: [] });
  }

  const result = await env.DB.prepare(
    `SELECT u.name, u.surname, u.created_at, COUNT(m.id) as material_count,
            MIN(m.faculty) as faculty
     FROM users u
     JOIN materials m ON m.user_id = u.id
     WHERE COALESCE(m.is_anonymous, 0) = 0
     GROUP BY u.id
     HAVING COUNT(m.id) > 0
     ORDER BY material_count DESC, u.name ASC, u.surname ASC`
  ).all();
  return jsonResponse({ contributors: result.results || [] });
}

async function handleUpload(request, env) {
  if (!env.DB) return databaseUnavailableResponse();
  const limited = await checkRateLimit(request, "upload", env);
  if (limited) return limited;

  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

  const form = await request.formData();
  const title = String(form.get("title") || "").trim();
  const faculty = String(form.get("faculty") || "").trim().toUpperCase();
  const department = String(form.get("department") || "").trim() || "//";
  const subject = String(form.get("subject") || "").trim();
  const teacher = String(form.get("teacher") || "").trim() || "//";
  const type = String(form.get("type") || "").trim();
  const isAnonymous = form.get("is_anonymous") === "1" ? 1 : 0;
  const studyLevelRaw = String(form.get("study_level") || "bachelor").trim().toLowerCase();
  const studyLevel = ["bachelor", "master", "phd"].includes(studyLevelRaw)
    ? studyLevelRaw
    : "bachelor";
  const file = form.get("file");

  if (!title || !faculty || !subject || !type || !file || typeof file === "string") {
    return jsonResponse({ error: "Plotësoni të gjitha fushat e detyrueshme." }, 400);
  }

  const ext = extFromFilename(file.name);
  const validation = await validateFile(file, ext);
  if (!validation.ok) return jsonResponse({ error: validation.error }, 400);

  const fileKey = `materials/${user.id}/${Date.now()}-${sanitizeFilename(file.name)}`;
  const buffer = await file.arrayBuffer();
  const contentType = file.type || "application/octet-stream";
  await env.MY_BUCKET.put(fileKey, buffer, {
    httpMetadata: { contentType },
  });

  const r2Url = keyToPublicUrl(fileKey);
  const insert = await env.DB.prepare(
    `INSERT INTO materials
      (user_id, title, faculty, department, subject, teacher, type, file_key, file_type, file_size, r2_url, is_anonymous, study_level)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
  )
    .bind(user.id, title, faculty, department, subject, teacher, type, fileKey, ext, file.size, r2Url, isAnonymous, studyLevel)
    .run();

  return jsonResponse({
    success: true,
    material: {
      id: insert.meta.last_row_id,
      title,
      faculty,
      department,
      subject,
      teacher,
      type,
      file_key: fileKey,
      file_type: ext,
      file_size: file.size,
      r2_url: r2Url,
    },
  });
}

async function handleEdit(request, url, env) {
  if (!env.DB) return databaseUnavailableResponse();
  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isFinite(id)) return jsonResponse({ error: "ID i pavlefshëm." }, 400);

  const material = await env.DB.prepare("SELECT * FROM materials WHERE id=?")
    .bind(id)
    .first();
  if (!material || (Number(material.user_id) !== Number(user.id) && !userIsModerator(user, env))) {
    return jsonResponse({ error: "Nuk keni leje." }, 403);
  }

  const body = await request.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const faculty = String(body.faculty || "").trim().toUpperCase();
  const department = String(body.department || "").trim() || "//";
  const subject = String(body.subject || "").trim();
  const teacher = String(body.teacher || "").trim() || "//";
  const type = String(body.type || "").trim();
  const studyLevelRaw = String(body.study_level || material.study_level || "bachelor")
    .trim()
    .toLowerCase();
  const studyLevel = ["bachelor", "master", "phd"].includes(studyLevelRaw)
    ? studyLevelRaw
    : "bachelor";

  if (!title || !faculty || !subject || !type) {
    return jsonResponse({ error: "Plotësoni të gjitha fushat e detyrueshme." }, 400);
  }

  await env.DB.prepare(
    `UPDATE materials
     SET title=?, faculty=?, department=?, subject=?, teacher=?, type=?, study_level=?, updated_at=datetime('now')
     WHERE id=?`
  )
    .bind(title, faculty, department, subject, teacher, type, studyLevel, id)
    .run();

  return jsonResponse({ success: true });
}

async function handleModeratorMaterials(request, url, env) {
  if (!env.DB) return databaseUnavailableResponse();
  const user = await getUserFromRequest(request, env);
  if (!user || !userIsModerator(user, env)) return jsonResponse({ error: "Unauthorized" }, 401);

  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const LIMIT = 50;
  const offset = (page - 1) * LIMIT;

  const [countRow, result] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS total FROM materials").first(),
    env.DB.prepare(
      `SELECT m.id, m.title, m.faculty, m.subject, m.type, m.file_type,
              m.r2_url, m.created_at, m.is_anonymous, m.study_level,
              m.pending_owner_email,
              u.name AS uploader_name, u.surname AS uploader_surname,
              u.email AS uploader_email
       FROM materials m
       LEFT JOIN users u ON m.user_id = u.id
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(LIMIT, offset)
      .all(),
  ]);

  return jsonResponse({
    materials: result.results || [],
    total: Number(countRow?.total || 0),
    page,
    limit: LIMIT,
  });
}

async function handleDeleteMaterial(request, env) {
  if (!env.DB) return databaseUnavailableResponse();
  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isFinite(id) || id <= 0) return jsonResponse({ error: "ID i pavlefshëm." }, 400);

  const material = await env.DB.prepare("SELECT * FROM materials WHERE id = ?").bind(id).first();
  if (!material) return jsonResponse({ error: "Materiali nuk u gjet." }, 404);

  if (Number(material.user_id) !== Number(user.id) && !userIsModerator(user, env)) {
    return jsonResponse({ error: "Nuk keni leje." }, 403);
  }

  if (env.MY_BUCKET) {
    const key = material.file_key || publicUrlToKey(material.r2_url);
    if (key) await env.MY_BUCKET.delete(key).catch(() => {});
  }

  try {
    await env.DB.prepare("DELETE FROM reports WHERE material_id = ?").bind(id).run();
  } catch {
    // reports table may not exist yet — non-fatal
  }

  await env.DB.prepare("DELETE FROM materials WHERE id = ?").bind(id).run();

  return jsonResponse({ success: true });
}

async function handleContact(request, env) {
  const limited = await checkRateLimit(request, "contact", env);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const senderName = String(body.senderName || "").trim();
  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();

  if (!senderName || !subject || message.length < 10 || message.length > 2000) {
    return jsonResponse(
      { error: "Plotësoni emrin, subjektin dhe mesazhin 10-2000 karaktere." },
      400
    );
  }

  let saved = false;
  if (env.DB) {
    try {
      await env.DB.prepare(
        "INSERT INTO contact_messages (sender_name, subject, message) VALUES (?,?,?)"
      )
        .bind(senderName, subject, message)
        .run();
      saved = true;
    } catch (error) {
      if (String(error.message || error).includes("no such table")) {
        await ensureContactMessagesTable(env);
        await env.DB.prepare(
          "INSERT INTO contact_messages (sender_name, subject, message) VALUES (?,?,?)"
        )
          .bind(senderName, subject, message)
          .run();
        saved = true;
      } else {
        throw error;
      }
    }
  }

  let sent = false;
  if (env.ADMIN_EMAIL) {
    const html = `
      <p><strong>Dërgues:</strong> ${escapeHtml(senderName)}</p>
      <p><strong>Subjekti:</strong> ${escapeHtml(subject)}</p>
      <p><strong>Mesazhi:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
      <hr>
      <small>Dërguar përmes formularit të kontaktit të E-Studenti. Për përgjigje direkte, përdorni Instagram: @estudenti.hub.</small>
    `;
    sent = await sendEmail(
      env.ADMIN_EMAIL,
      `[E-Studenti] ${subject}`,
      html,
      env,
      env.RESEND_CONTACT_FROM || env.RESEND_FROM || DEFAULT_RESEND_FROM
    );
  }

  if (!saved && !sent) {
    return jsonResponse(
      { error: "Mesazhi nuk mund të ruhej. Ju lutemi shkruani në Instagram: @estudenti.hub." },
      503
    );
  }

  return jsonResponse({
    success: true,
    message:
      "Mesazhi u pranua. Për përgjigje direkte, shkruani në Instagram: @estudenti.hub.",
  });
}

async function handleResourceLinks(request, url, env) {
  if (!env.DB) return databaseUnavailableResponse();

  const faculty = url.searchParams.get("faculty");
  const category = url.searchParams.get("category");
  const q = url.searchParams.get("q") || url.searchParams.get("search");
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const offset = (page - 1) * limit;

  const where = ["r.status = 'approved'"];
  const params = [];

  if (faculty) {
    where.push("r.faculty = ?");
    params.push(faculty.toUpperCase());
  }
  if (category && RESOURCE_CATEGORIES.includes(category)) {
    where.push("r.category = ?");
    params.push(category);
  }
  if (q) {
    const search = buildResourceSearchClause(q);
    where.push(search.clause);
    params.push(...search.params);
  }

  const countRow = await env.DB.prepare(
    `SELECT COUNT(*) AS total
     FROM resource_links r
     JOIN users u ON r.user_id = u.id
     WHERE ${where.join(" AND ")}`
  )
    .bind(...params)
    .first();

  const result = await env.DB.prepare(
    `SELECT r.id, r.url, r.resolved_url, r.resolved_domain, r.was_shortened,
            r.title, r.description, r.category, r.faculty, r.subject,
            r.is_anonymous, r.created_at,
            TRIM(COALESCE(u.name, '') || ' ' || COALESCE(u.surname, '')) AS submitter_name
     FROM resource_links r
     JOIN users u ON r.user_id = u.id
     WHERE ${where.join(" AND ")}
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(...params, limit, offset)
    .all();

  const links = (result.results || []).map((link) => sanitizeResourceLinkForPublic(link));
  const total = Number(countRow?.total || 0);

  return jsonResponse({
    links,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: offset + links.length < total,
    },
  });
}

async function handleSubmitResourceLink(request, env) {
  if (!env.DB) return databaseUnavailableResponse();
  const limited = await checkRateLimit(request, "resource_link", env);
  if (limited) return limited;

  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const category = String(body.category || "").trim();
  const faculty = String(body.faculty || "").trim().toUpperCase();
  const subject = String(body.subject || "").trim() || "//";
  const isAnonymous = body.is_anonymous === true || body.is_anonymous === 1 ? 1 : 0;
  const rawUrl = String(body.url || "").trim();

  if (!title || !description || !faculty || !rawUrl) {
    return jsonResponse({ error: "Plotësoni të gjitha fushat e detyrueshme." }, 400);
  }
  if (description.length < 10 || description.length > 1000) {
    return jsonResponse({ error: "Përshkrimi duhet të jetë 10–1000 karaktere." }, 400);
  }
  if (!RESOURCE_CATEGORIES.includes(category)) {
    return jsonResponse({ error: "Kategoria nuk është e vlefshme." }, 400);
  }

  const resolved = await resolveResourceUrl(rawUrl);
  if (!resolved.ok) return jsonResponse({ error: resolved.error }, 400);

  const safeBrowsing = await checkSafeBrowsing(resolved.resolved_url, env);
  const safetyFlags = {
    was_shortened: Boolean(resolved.was_shortened),
    original_domain: extractDomainFromUrl(resolved.url),
    resolved_domain: resolved.resolved_domain,
    safe_browsing: safeBrowsing,
  };

  const insert = await env.DB.prepare(
    `INSERT INTO resource_links
      (user_id, url, resolved_url, resolved_domain, was_shortened, title, description,
       category, faculty, subject, is_anonymous, status, safety_flags)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,'pending',?)`
  )
    .bind(
      user.id,
      resolved.url,
      resolved.resolved_url,
      resolved.resolved_domain,
      resolved.was_shortened,
      title,
      description,
      category,
      faculty,
      subject,
      isAnonymous,
      JSON.stringify(safetyFlags)
    )
    .run();

  return jsonResponse({
    success: true,
    message:
      "Lidhja u dërgua për moderim. Do të shfaqet publikisht vetëm pas aprovimit.",
    id: insert.meta.last_row_id,
  });
}

function extractDomainFromUrl(urlString) {
  try {
    return new URL(urlString).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

async function handleModeratorResourceLinks(request, url, env) {
  if (!env.DB) return databaseUnavailableResponse();
  const user = await getUserFromRequest(request, env);
  if (!user || !userIsModerator(user, env)) return jsonResponse({ error: "Unauthorized" }, 401);

  const status = url.searchParams.get("status") || "pending";
  const allowed = ["pending", "approved", "rejected", "all"];
  const filterStatus = allowed.includes(status) ? status : "pending";

  const where = filterStatus === "all" ? "1=1" : "r.status = ?";
  const params = filterStatus === "all" ? [] : [filterStatus];

  const result = await env.DB.prepare(
    `SELECT r.*,
            TRIM(COALESCE(u.name, '') || ' ' || COALESCE(u.surname, '')) AS submitter_name,
            u.email AS submitter_email
     FROM resource_links r
     JOIN users u ON r.user_id = u.id
     WHERE ${where}
     ORDER BY r.created_at DESC
     LIMIT 100`
  )
    .bind(...params)
    .all();

  const links = (result.results || []).map((link) => ({
    ...link,
    safety_flags: parseSafetyFlags(link.safety_flags),
  }));

  return jsonResponse({ links });
}

async function handleModerateResourceLink(request, env) {
  if (!env.DB) return databaseUnavailableResponse();
  const user = await getUserFromRequest(request, env);
  if (!user || !userIsModerator(user, env)) return jsonResponse({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  const decision = String(body.decision || "").trim();
  const rejectionReason = String(body.rejection_reason || "").trim();

  if (!Number.isFinite(id) || id <= 0) {
    return jsonResponse({ error: "ID i pavlefshëm." }, 400);
  }
  if (!["approve", "reject"].includes(decision)) {
    return jsonResponse({ error: "Vendimi nuk është i vlefshëm." }, 400);
  }
  if (decision === "reject" && rejectionReason.length < 5) {
    return jsonResponse({ error: "Jepni një arsye refuzimi (min. 5 karaktere)." }, 400);
  }

  const link = await env.DB.prepare("SELECT * FROM resource_links WHERE id=?").bind(id).first();
  if (!link) return jsonResponse({ error: "Lidhja nuk u gjet." }, 404);
  if (link.status !== "pending") {
    return jsonResponse({ error: "Kjo lidhje është trajtuar tashmë." }, 400);
  }

  const status = decision === "approve" ? "approved" : "rejected";
  await env.DB.prepare(
    `UPDATE resource_links
     SET status=?, rejection_reason=?, moderator_id=?, reviewed_at=datetime('now')
     WHERE id=?`
  )
    .bind(status, decision === "reject" ? rejectionReason : null, user.id, id)
    .run();

  return jsonResponse({ success: true, status });
}

async function handleGenerate(request, env) {
  return handleUpload(request, env);
}

async function handleProxy(url) {
  const target = url.searchParams.get("url");
  if (!target) return jsonResponse({ error: "Missing url" }, 400);
  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return jsonResponse({ error: "Invalid url" }, 400);
  }
  if (parsed.origin !== MEDIA_BASE) {
    return jsonResponse({ error: "URL not allowed" }, 403);
  }
  const res = await fetch(target, { redirect: "follow" });
  return new Response(res.body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "application/octet-stream",
      "Cache-Control": "public, max-age=300",
    },
  });
}

async function handleTrackView(request, env) {
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  if (!env.DB) return databaseUnavailableResponse();
  const limited = await checkRateLimit(request, "track_view", env);
  if (limited) return limited;
  const result = await trackMaterialEvent(request, env, "view");
  return jsonResponse(result);
}

async function handleTrackDownload(request, env) {
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  if (!env.DB) return databaseUnavailableResponse();
  const limited = await checkRateLimit(request, "track_download", env);
  if (limited) return limited;
  const result = await trackMaterialEvent(request, env, "download");
  return jsonResponse(result);
}

async function handleSiteStatistics(url, env) {
  if (!env.DB) return databaseUnavailableResponse();
  const period = url.searchParams.get("period") || "7d";
  const payload = await loadSiteStats(env, period);
  return jsonResponse(payload);
}

export default {
  async scheduled(_event, env, ctx) {
    if (!env.DB) return;
    ctx.waitUntil(refreshSiteStats(env));
  },

  async fetch(request, env) {
    if (!isAllowedOrigin(request, env)) {
      return withCors(jsonResponse({ error: "Origin not allowed" }, 403), request, env);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get("action") || "materials";
    const accountActions = [
      "register",
      "verify",
      "login",
      "me",
      "material",
      "upload",
      "generate",
      "edit",
      "reports",
      "resolve-report",
      "moderator-materials",
      "delete-material",
      "submit-resource-link",
      "moderator-resource-links",
      "moderate-resource-link",
    ];
    const publicActions = [
      "materials",
      "material-public",
      "resource-links",
      "contributors",
      "proxy",
      "register",
      "verify",
      "login",
      "contact",
      "get",
      "logout",
      "report",
      "track-view",
      "track-download",
      "site-statistics",
    ];

    try {
      if (accountActions.includes(action) && !env.DB) {
        return withCors(databaseUnavailableResponse(), request, env);
      }

      if (!publicActions.includes(action)) {
        const user = await getUserFromRequest(request, env);
        if (!user) {
          return withCors(jsonResponse({ error: "Unauthorized" }, 401), request, env);
        }
      }

      let response;
      switch (action) {
        case "materials":
        case "get":
          response = await handleMaterials(request, url, env);
          break;
        case "material-public":
          response = await handlePublicMaterial(url, env);
          break;
        case "contributors":
          response = await handleContributors(env);
          break;
        case "register":
          response = await handleRegister(request, env);
          break;
        case "verify":
          response = await handleVerify(request, env);
          break;
        case "login":
          response = await handleLogin(request, env);
          break;
        case "contact":
          response = await handleContact(request, env);
          break;
        case "upload":
          response = await handleUpload(request, env);
          break;
        case "generate":
          response = await handleGenerate(request, env);
          break;
        case "edit":
          response = await handleEdit(request, url, env);
          break;
        case "material":
          response = await handleMaterial(request, url, env);
          break;
        case "proxy":
          response = await handleProxy(url);
          break;
        case "me":
          response = await handleMe(request, env);
          break;
        case "logout":
          response = handleLogout();
          break;
        case "report":
          response = await handleReport(request, env);
          break;
        case "reports":
          response = await handleReports(request, env);
          break;
        case "resolve-report":
          response = await handleResolveReport(request, env);
          break;
        case "moderator-materials":
          response = await handleModeratorMaterials(request, url, env);
          break;
        case "delete-material":
          response = await handleDeleteMaterial(request, env);
          break;
        case "resource-links":
          response = await handleResourceLinks(request, url, env);
          break;
        case "submit-resource-link":
          response = await handleSubmitResourceLink(request, env);
          break;
        case "moderator-resource-links":
          response = await handleModeratorResourceLinks(request, url, env);
          break;
        case "moderate-resource-link":
          response = await handleModerateResourceLink(request, env);
          break;
        case "track-view":
          response = await handleTrackView(request, env);
          break;
        case "track-download":
          response = await handleTrackDownload(request, env);
          break;
        case "site-statistics":
          response = await handleSiteStatistics(url, env);
          break;
        default:
          response = jsonResponse({ error: "Invalid action" }, 400);
      }
      return withCors(response, request, env);
    } catch (error) {
      console.error(error);
      return withCors(
        jsonResponse({ error: "Ndodhi një gabim i brendshëm." }, 500),
        request,
        env
      );
    }
  },
};
