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

-- The request an upload answers; resolved when the material is published.
ALTER TABLE materials ADD COLUMN request_id INTEGER;

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
