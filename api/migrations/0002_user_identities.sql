-- Accounts at an OpenID Connect provider (e.g. Google) that sign in as a user.
-- `subject` is the provider's stable id for the account; the email can change.
-- Users created through a provider have no password (see NO_PASSWORD in src/lib/password.ts).
CREATE TABLE user_identities (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  issuer     TEXT    NOT NULL,
  subject    TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (issuer, subject)
);
CREATE INDEX user_identities_user_id_idx ON user_identities (user_id);
