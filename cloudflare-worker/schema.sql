CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  surname TEXT,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER DEFAULT 0,
  is_moderator INTEGER NOT NULL DEFAULT 0,
  token_version INTEGER NOT NULL DEFAULT 0,
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
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_materials_user ON materials(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_faculty ON materials(faculty);

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
