-- Reports: one per reporter per material, and a way to count *different* people.
--   reporter_key is "u:<user id>" for signed-in reporters and "a:<salted hash of
--   the address>" for anonymous ones. Older rows have none and each count as one.
ALTER TABLE reports ADD COLUMN reporter_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_one_per_reporter
  ON reports(material_id, reporter_key) WHERE reporter_key IS NOT NULL;

-- Which flagged materials the moderator has already been emailed about, so a
-- file with 3+ open reports produces one nudge and one reminder a day, not a flood.
CREATE TABLE IF NOT EXISTS report_alerts (
  material_id INTEGER PRIMARY KEY,
  notified_at TEXT,
  reminded_at TEXT
);

-- A moderator can withdraw an uploader's trust: their uploads go back to review
-- even if they have enough approved materials.
ALTER TABLE users ADD COLUMN trust_revoked INTEGER NOT NULL DEFAULT 0;
