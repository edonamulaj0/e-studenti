CREATE TABLE IF NOT EXISTS site_stats (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  payload TEXT NOT NULL,
  computed_at TEXT NOT NULL,
  tracking_since TEXT NOT NULL
);
