-- Session revocation: bump token_version to invalidate outstanding JWTs on logout.
ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;
