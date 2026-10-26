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
