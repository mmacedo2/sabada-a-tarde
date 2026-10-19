-- Adds the `manager` role (edits games only). SQLite cannot change a CHECK constraint, and
-- rebuilding `users` would cascade-delete sessions and identities, so the column is swapped in place.
ALTER TABLE users ADD COLUMN role_new TEXT NOT NULL DEFAULT 'user'
  CHECK (role_new IN ('user', 'manager', 'admin'));
UPDATE users SET role_new = role;
ALTER TABLE users DROP COLUMN role;
ALTER TABLE users RENAME COLUMN role_new TO role;

-- 0 only for accounts people created themselves with an email nobody checked. Admins, the
-- create-admin script and OIDC providers vouch for the others. An OIDC sign-in with the same
-- verified email takes an unverified account over (see src/routes/oidc.ts).
ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1
  CHECK (email_verified IN (0, 1));

-- Self-registrations per IP, for throttling.
CREATE TABLE signup_attempts (
  ip           TEXT,
  attempted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX signup_attempts_ip_idx ON signup_attempts (ip, attempted_at);
