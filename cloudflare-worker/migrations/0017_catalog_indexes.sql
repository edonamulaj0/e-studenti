-- The public catalogue filters on status and sorts by created_at (or a
-- counter); per-row "trusted uploader" checks count approved rows per user.
CREATE INDEX IF NOT EXISTS idx_materials_status_created ON materials(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_materials_user_status ON materials(user_id, status);
CREATE INDEX IF NOT EXISTS idx_resource_links_status_created ON resource_links(status, created_at DESC);
