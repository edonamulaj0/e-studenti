-- Bulk upload support.
-- content_hash: SHA-256 of the file, computed by the uploader's browser. It is
--   advisory (used to warn about likely duplicates), never trusted for security.
-- client_upload_id: a per-file id chosen by the browser so that retrying an
--   upload whose response was lost returns the existing row instead of a copy.
ALTER TABLE materials ADD COLUMN content_hash TEXT;
ALTER TABLE materials ADD COLUMN client_upload_id TEXT;
CREATE INDEX IF NOT EXISTS idx_materials_content_hash ON materials(content_hash);
CREATE UNIQUE INDEX IF NOT EXISTS idx_materials_client_upload
  ON materials(user_id, client_upload_id) WHERE client_upload_id IS NOT NULL;
