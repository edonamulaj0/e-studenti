CREATE TABLE IF NOT EXISTS material_stat_events (
  dedupe_key TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  material_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_material_stat_events_type_date
  ON material_stat_events(event_type, created_at);
