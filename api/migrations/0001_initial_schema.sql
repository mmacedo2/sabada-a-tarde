-- Initial schema for Sábado à Tarde.
--
-- Conventions:
--   * Timestamps are UTC ISO-8601 strings (`2026-10-16T18:30:00.000Z`).
--   * Calendar dates (`date`, `*_on`) are `YYYY-MM-DD` and kickoff times `HH:MM`,
--     both in Europe/Lisbon local time, so a fixture never shifts across DST.
--   * Booleans are INTEGER 0/1.
--   * D1 enforces foreign keys; deletes that would orphan rows fail with 409.

CREATE TABLE users (
  id            INTEGER PRIMARY KEY,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  name          TEXT    NOT NULL,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  active        INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  last_login_at TEXT,
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- `id` is the SHA-256 of the session cookie, so a database leak does not leak live sessions.
CREATE TABLE sessions (
  id         TEXT    PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at TEXT    NOT NULL,
  ip         TEXT,
  user_agent TEXT,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX sessions_user_id_idx ON sessions (user_id);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);

-- Failed logins, used to throttle password guessing per email and per IP.
CREATE TABLE login_attempts (
  id           INTEGER PRIMARY KEY,
  email        TEXT NOT NULL COLLATE NOCASE,
  ip           TEXT,
  attempted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX login_attempts_email_idx ON login_attempts (email, attempted_at);
CREATE INDEX login_attempts_ip_idx ON login_attempts (ip, attempted_at);

CREATE TABLE seasons (
  id         INTEGER PRIMARY KEY,
  name       TEXT    NOT NULL UNIQUE,
  starts_on  TEXT    NOT NULL,
  ends_on    TEXT    NOT NULL,
  is_current INTEGER NOT NULL DEFAULT 0 CHECK (is_current IN (0, 1)),
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (starts_on < ends_on)
);
CREATE UNIQUE INDEX seasons_single_current_idx ON seasons (is_current) WHERE is_current = 1;

CREATE TABLE clubs (
  id          INTEGER PRIMARY KEY,
  slug        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  short_name  TEXT    NOT NULL,
  initials    TEXT,
  locality    TEXT,
  crest_url   TEXT,
  color       TEXT,
  color_label TEXT,
  founded_on  TEXT,
  website     TEXT,
  visible     INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE competitions (
  id          INTEGER PRIMARY KEY,
  slug        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  kind        TEXT    NOT NULL CHECK (kind IN ('league', 'cup', 'award')),
  tagline     TEXT,
  description TEXT,
  logo_url    TEXT,
  source_url  TEXT,
  position    INTEGER NOT NULL DEFAULT 0,
  visible     INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- A side is either a club or, while a cup tie is undecided, a placeholder
-- such as "Vencedor jogo 4".
CREATE TABLE games (
  id               INTEGER PRIMARY KEY,
  season_id        INTEGER NOT NULL REFERENCES seasons (id),
  competition_id   INTEGER NOT NULL REFERENCES competitions (id),
  round            TEXT    NOT NULL,
  stage            TEXT,
  home_club_id     INTEGER REFERENCES clubs (id),
  away_club_id     INTEGER REFERENCES clubs (id),
  home_placeholder TEXT,
  away_placeholder TEXT,
  date             TEXT    NOT NULL,
  kickoff_time     TEXT,
  venue            TEXT,
  status           TEXT    NOT NULL DEFAULT 'scheduled'
                   CHECK (status IN ('scheduled', 'live', 'halftime', 'finished', 'postponed', 'cancelled')),
  home_goals       INTEGER CHECK (home_goals >= 0),
  away_goals       INTEGER CHECK (away_goals >= 0),
  home_penalties   INTEGER CHECK (home_penalties >= 0),
  away_penalties   INTEGER CHECK (away_penalties >= 0),
  notes            TEXT,
  visible          INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (home_club_id IS NOT NULL OR home_placeholder IS NOT NULL),
  CHECK (away_club_id IS NOT NULL OR away_placeholder IS NOT NULL),
  CHECK (home_club_id IS NULL OR away_club_id IS NULL OR home_club_id <> away_club_id),
  CHECK (status NOT IN ('live', 'halftime', 'finished') OR (home_goals IS NOT NULL AND away_goals IS NOT NULL)),
  CHECK (status NOT IN ('live', 'halftime', 'finished') OR (home_club_id IS NOT NULL AND away_club_id IS NOT NULL))
);
CREATE INDEX games_season_competition_date_idx ON games (season_id, competition_id, date);
CREATE INDEX games_date_idx ON games (date);
CREATE INDEX games_home_club_id_idx ON games (home_club_id);
CREATE INDEX games_away_club_id_idx ON games (away_club_id);
CREATE INDEX games_live_idx ON games (status) WHERE status IN ('live', 'halftime');

CREATE TABLE players (
  id         INTEGER PRIMARY KEY,
  name       TEXT    NOT NULL,
  nickname   TEXT,
  position   TEXT    CHECK (position IN ('goalkeeper', 'defender', 'midfielder', 'forward')),
  club_id    INTEGER REFERENCES clubs (id) ON DELETE SET NULL,
  photo_url  TEXT,
  birth_date TEXT,
  visible    INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX players_club_id_idx ON players (club_id);

-- `club_id` is always the club of the player involved; for an own goal the
-- goal counts for the other side.
CREATE TABLE game_events (
  id          INTEGER PRIMARY KEY,
  game_id     INTEGER NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  club_id     INTEGER NOT NULL REFERENCES clubs (id),
  player_id   INTEGER REFERENCES players (id) ON DELETE SET NULL,
  player_name TEXT,
  type        TEXT    NOT NULL CHECK (type IN ('goal', 'penalty_goal', 'own_goal', 'yellow_card', 'red_card')),
  minute      INTEGER CHECK (minute BETWEEN 0 AND 150),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX game_events_game_id_idx ON game_events (game_id);
CREATE INDEX game_events_player_id_idx ON game_events (player_id);

CREATE TABLE transfers (
  id           INTEGER PRIMARY KEY,
  player_id    INTEGER NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  from_club_id INTEGER REFERENCES clubs (id) ON DELETE SET NULL,
  to_club_id   INTEGER REFERENCES clubs (id) ON DELETE SET NULL,
  date         TEXT    NOT NULL,
  notes        TEXT,
  visible      INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (from_club_id IS NULL OR to_club_id IS NULL OR from_club_id <> to_club_id)
);
CREATE INDEX transfers_date_idx ON transfers (date DESC);
CREATE INDEX transfers_player_id_idx ON transfers (player_id, date);

-- `published_at` in the future schedules the article.
CREATE TABLE articles (
  id           INTEGER PRIMARY KEY,
  slug         TEXT    NOT NULL UNIQUE,
  kind         TEXT    NOT NULL DEFAULT 'news' CHECK (kind IN ('news', 'announcement')),
  title        TEXT    NOT NULL,
  summary      TEXT,
  body         TEXT    NOT NULL,
  cover_url    TEXT,
  author_id    INTEGER REFERENCES users (id) ON DELETE SET NULL,
  status       TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TEXT,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (status = 'draft' OR published_at IS NOT NULL)
);
CREATE INDEX articles_published_idx ON articles (status, published_at DESC);

CREATE TABLE documents (
  id           INTEGER PRIMARY KEY,
  title        TEXT    NOT NULL,
  category     TEXT    NOT NULL,
  url          TEXT    NOT NULL,
  published_on TEXT,
  visible      INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX documents_category_idx ON documents (category);

CREATE TABLE audit_log (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER REFERENCES users (id) ON DELETE SET NULL,
  action     TEXT    NOT NULL,
  entity     TEXT    NOT NULL,
  entity_id  INTEGER,
  details    TEXT,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX audit_log_created_at_idx ON audit_log (created_at DESC);
