-- OP Game Hub accounts database (Cloudflare D1).
-- Paste this into the D1 console once. Safe to run again: it never deletes anything.
--
-- What we keep per player: Google's account number for them (so we know it's the same
-- person next time), the display name they pick, and when they joined.
-- No email, no real name, no photo.

CREATE TABLE IF NOT EXISTS users (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  google_sub          TEXT    NOT NULL UNIQUE,
  username            TEXT    UNIQUE COLLATE NOCASE,
  username_changed_at INTEGER,
  created_at          INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT    PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_by_user ON sessions(user_id);
