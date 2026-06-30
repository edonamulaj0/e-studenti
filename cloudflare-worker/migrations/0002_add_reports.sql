ALTER TABLE users ADD COLUMN is_moderator INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id INTEGER NOT NULL REFERENCES materials(id),
  reporter_id INTEGER REFERENCES users(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reports_material ON reports(material_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
