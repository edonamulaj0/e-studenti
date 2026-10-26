-- Unhandled Worker errors, counted per hour, so the hourly job can email the
-- moderator when they spike instead of waiting for someone to notice. Only
-- the action name and the error message are kept: no request data.
CREATE TABLE IF NOT EXISTS worker_errors (
  hour TEXT PRIMARY KEY,                   -- YYYY-MM-DDTHH, UTC
  count INTEGER NOT NULL DEFAULT 0,
  last_action TEXT,
  last_message TEXT
);
-- When each kind of operational alert last went out, to send at most one per window.
CREATE TABLE IF NOT EXISTS ops_alerts (
  name TEXT PRIMARY KEY,
  sent_at TEXT NOT NULL
);
