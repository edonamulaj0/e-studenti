-- Which R2 bucket holds a material's file: 'public' (e-studenti-materials,
-- served at media.e-studenti.com) or 'pending' (e-studenti-pending, never
-- exposed; owner and moderator read it through the Worker). Files move to
-- 'public' when approved and back when a material is taken off the site.
ALTER TABLE materials ADD COLUMN storage TEXT NOT NULL DEFAULT 'public';
