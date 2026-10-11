-- Review queue: uploads from users who are not yet trusted wait as 'pending'
-- until a moderator approves them. Existing rows stay publicly visible.
ALTER TABLE materials ADD COLUMN status TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE materials ADD COLUMN rejection_reason TEXT;
ALTER TABLE materials ADD COLUMN reviewed_at TEXT;
ALTER TABLE materials ADD COLUMN reviewed_by INTEGER;
CREATE INDEX IF NOT EXISTS idx_materials_status ON materials(status);
