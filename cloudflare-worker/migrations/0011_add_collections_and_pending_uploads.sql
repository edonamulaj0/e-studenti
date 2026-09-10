-- Bulk upload, schema half.
--
-- collections: a folder uploaded in one go stays one thing. Each file inside it
-- is still its own material, individually searchable and previewable, but the
-- catalogue can present them together as "Algjebra Lineare — 12 materiale".
-- Zipping the folder was the alternative and it loses per-file search.
CREATE TABLE IF NOT EXISTS collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  faculty TEXT NOT NULL,
  department TEXT DEFAULT '//',
  subject TEXT NOT NULL,
  study_level TEXT NOT NULL DEFAULT 'bachelor',
  is_anonymous INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_faculty ON collections(faculty);

ALTER TABLE materials ADD COLUMN collection_id INTEGER REFERENCES collections(id);
CREATE INDEX IF NOT EXISTS idx_materials_collection ON materials(collection_id);

-- pending_uploads: files that have been presigned and may already be sitting in
-- the quarantine bucket, but have not passed validation and are not materials.
--
-- Deliberately a separate table rather than a status column on materials: every
-- existing catalogue, search, statistics and contributors query reads materials
-- without filtering, and adding an unpublished state there would mean auditing
-- all of them for a leak. Nothing reads this table but the commit step and the
-- sweeper, so nothing unvalidated can reach the public catalogue by omission.
CREATE TABLE IF NOT EXISTS pending_uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  collection_id INTEGER REFERENCES collections(id),
  -- The key the worker chose and signed. Unique so a replayed commit cannot
  -- create a second material for one object.
  object_key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  declared_size INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pending_uploads_user ON pending_uploads(user_id);
-- The sweeper scans by age.
CREATE INDEX IF NOT EXISTS idx_pending_uploads_created ON pending_uploads(created_at);
