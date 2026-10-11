-- Materials belong to a university. Everything uploaded so far was for the
-- University of Prishtina, so that is the default. Outside UP the `faculty`
-- column holds a study field code (see shared/material-options.mjs).
ALTER TABLE materials ADD COLUMN university TEXT NOT NULL DEFAULT 'universiteti-i-prishtines-hasan-prishtina';
CREATE INDEX IF NOT EXISTS idx_materials_university ON materials(university);
