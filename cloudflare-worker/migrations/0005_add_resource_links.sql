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
