-- Add anonymous flag to materials table.
-- is_anonymous = 1 means the material is displayed without the uploader's name on public views.
-- user_id remains required and is always stored regardless of this flag.
-- All existing rows default to 0 (non-anonymous) so no data is affected.
ALTER TABLE materials ADD COLUMN is_anonymous INTEGER NOT NULL DEFAULT 0;
