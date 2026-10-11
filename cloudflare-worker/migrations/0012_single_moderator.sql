-- Moderator access is now decided in code from one email address
-- (see src/moderators.js). Make the informational column agree with that.
UPDATE users SET is_moderator = CASE WHEN lower(email) = 'edonaamulaj@gmail.com' THEN 1 ELSE 0 END;
