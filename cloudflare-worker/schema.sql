CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  surname TEXT,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER DEFAULT 0,
  is_moderator INTEGER NOT NULL DEFAULT 0,
  token_version INTEGER NOT NULL DEFAULT 0,
  trust_revoked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS verification_codes (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  university TEXT NOT NULL DEFAULT 'universiteti-i-prishtines-hasan-prishtina',
  faculty TEXT NOT NULL,
  department TEXT DEFAULT '//',
  subject TEXT NOT NULL,
  teacher TEXT DEFAULT '//',
  type TEXT NOT NULL,
  file_key TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  r2_url TEXT NOT NULL,
  is_anonymous INTEGER NOT NULL DEFAULT 0,
  study_level TEXT NOT NULL DEFAULT 'bachelor',
  view_count INTEGER NOT NULL DEFAULT 0,
  download_count INTEGER NOT NULL DEFAULT 0,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  unhelpful_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'approved',
  rejection_reason TEXT,
  reviewed_at TEXT,
  reviewed_by INTEGER,
  content_hash TEXT,
  client_upload_id TEXT,
  request_id INTEGER,
  storage TEXT NOT NULL DEFAULT 'public',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_materials_status ON materials(status);
CREATE INDEX IF NOT EXISTS idx_materials_content_hash ON materials(content_hash);
CREATE UNIQUE INDEX IF NOT EXISTS idx_materials_client_upload
  ON materials(user_id, client_upload_id) WHERE client_upload_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_materials_user ON materials(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_status_created ON materials(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_materials_user_status ON materials(user_id, status);
CREATE INDEX IF NOT EXISTS idx_materials_faculty ON materials(faculty);
CREATE INDEX IF NOT EXISTS idx_materials_university ON materials(university);
CREATE INDEX IF NOT EXISTS idx_materials_helpful ON materials(status, helpful_count DESC);

CREATE TABLE IF NOT EXISTS material_stat_events (
  dedupe_key TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  material_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_material_stat_events_type_date
  ON material_stat_events(event_type, created_at);

CREATE TABLE IF NOT EXISTS site_stats (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  payload TEXT NOT NULL,
  computed_at TEXT NOT NULL,
  tracking_since TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rebuild_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  dirty_since TEXT,
  last_triggered_at TEXT
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id INTEGER NOT NULL,
  reporter_id INTEGER,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reporter_key TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_one_per_reporter
  ON reports(material_id, reporter_key) WHERE reporter_key IS NOT NULL;
CREATE TABLE IF NOT EXISTS report_alerts (
  material_id INTEGER PRIMARY KEY,
  notified_at TEXT,
  reminded_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_reports_material ON reports(material_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

CREATE TABLE IF NOT EXISTS resource_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  url TEXT NOT NULL,
  resolved_url TEXT NOT NULL,
  resolved_domain TEXT NOT NULL,
  was_shortened INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  faculty TEXT NOT NULL,
  subject TEXT DEFAULT '//',
  is_anonymous INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  safety_flags TEXT,
  moderator_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_resource_links_status ON resource_links(status);
CREATE INDEX IF NOT EXISTS idx_resource_links_faculty ON resource_links(faculty);
CREATE INDEX IF NOT EXISTS idx_resource_links_status_created ON resource_links(status, created_at DESC);

-- "Kërkesat": students ask for a material that is missing; others add their
-- vote. A request is fulfilled when an upload that answers it is published.
CREATE TABLE IF NOT EXISTS material_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  university TEXT NOT NULL,
  faculty TEXT NOT NULL,
  subject TEXT NOT NULL,
  type TEXT,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open',       -- open | fulfilled | removed
  fulfilled_material_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  fulfilled_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_material_requests_status ON material_requests(status, created_at DESC);

CREATE TABLE IF NOT EXISTS material_request_votes (
  request_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (request_id, user_id)
);

-- Subjects a user follows, by subject slug, for the weekly digest email.
CREATE TABLE IF NOT EXISTS subject_follows (
  user_id INTEGER NOT NULL,
  subject_slug TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, subject_slug)
);
CREATE INDEX IF NOT EXISTS idx_subject_follows_slug ON subject_follows(subject_slug);

-- When the weekly digest last went out, so the hourly cron sends it once.
CREATE TABLE IF NOT EXISTS digest_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_sent_at TEXT
);
INSERT OR IGNORE INTO digest_state (id, last_sent_at) VALUES (1, NULL);

-- Passkeys (WebAuthn credentials). The moderator account must confirm sign-in
-- with one once any is registered.
CREATE TABLE IF NOT EXISTS passkeys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,      -- base64url
  public_key TEXT NOT NULL,                -- JWK (P-256)
  sign_count INTEGER NOT NULL DEFAULT 0,
  name TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  last_used_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_passkeys_user ON passkeys(user_id);

-- One-time challenges for registering a passkey or finishing a sign-in.
CREATE TABLE IF NOT EXISTS webauthn_challenges (
  challenge TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  purpose TEXT NOT NULL,                   -- register | login
  expires_at INTEGER NOT NULL              -- unix seconds
);

-- Searches that found nothing, counted by their folded text (lowercase, no
-- accents). Only the words are kept: no address, account or time of each
-- search. The moderator sees the most frequent ones as missing content.
CREATE TABLE IF NOT EXISTS search_misses (
  query TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  first_seen TEXT DEFAULT (datetime('now')),
  last_seen TEXT DEFAULT (datetime('now')),
  dismissed INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_search_misses_count ON search_misses(dismissed, count DESC);

-- "Was this useful?" votes on materials. One vote per person per material:
-- signed-in people by account, others by a salted hash of their address,
-- the same keys reports use. The totals are kept on the material so the
-- catalog can sort by them without counting on every request.
CREATE TABLE IF NOT EXISTS material_votes (
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  voter_key TEXT NOT NULL,
  helpful INTEGER NOT NULL,                -- 1 useful, 0 not useful
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (material_id, voter_key)
);

-- Unhandled Worker errors, counted per hour, and when ops alerts last went out.
CREATE TABLE IF NOT EXISTS worker_errors (
  hour TEXT PRIMARY KEY,                   -- YYYY-MM-DDTHH, UTC
  count INTEGER NOT NULL DEFAULT 0,
  last_action TEXT,
  last_message TEXT
);
CREATE TABLE IF NOT EXISTS ops_alerts (
  name TEXT PRIMARY KEY,
  sent_at TEXT NOT NULL
);
