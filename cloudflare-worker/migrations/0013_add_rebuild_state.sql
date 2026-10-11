-- Tracks whether the public catalogue changed since the static site was last
-- rebuilt, so the Worker can ask Cloudflare Pages for a new build (batched).
CREATE TABLE IF NOT EXISTS rebuild_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  dirty_since TEXT,
  last_triggered_at TEXT
);
