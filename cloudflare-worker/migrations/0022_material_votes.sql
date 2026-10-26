-- "Was this useful?" votes on materials. One vote per person per material:
-- signed-in people by account, others by a salted hash of their address,
-- the same keys reports use. The totals are kept on the material so the
-- catalog can sort by them without counting on every request.
CREATE TABLE IF NOT EXISTS material_votes (
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  voter_key TEXT NOT NULL,
  helpful INTEGER NOT NULL,                -- 1 useful, 0 not useful
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (material_id, voter_key)
);
ALTER TABLE materials ADD COLUMN helpful_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE materials ADD COLUMN unhelpful_count INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_materials_helpful ON materials(status, helpful_count DESC);
