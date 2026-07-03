ALTER TABLE materials ADD COLUMN study_level TEXT NOT NULL DEFAULT 'bachelor';
UPDATE materials SET study_level = 'bachelor' WHERE study_level IS NULL OR study_level = '';
