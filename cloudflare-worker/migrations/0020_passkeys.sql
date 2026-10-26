-- Passkeys (WebAuthn credentials). The moderator account must confirm sign-in
-- with one once any is registered.
CREATE TABLE IF NOT EXISTS passkeys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,      -- base64url
  public_key TEXT NOT NULL,                -- JWK (P-256)
  sign_count INTEGER NOT NULL DEFAULT 0,
  name TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  last_used_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_passkeys_user ON passkeys(user_id);

-- One-time challenges for registering a passkey or finishing a sign-in.
CREATE TABLE IF NOT EXISTS webauthn_challenges (
  challenge TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  purpose TEXT NOT NULL,                   -- register | login
  expires_at INTEGER NOT NULL              -- unix seconds
);
