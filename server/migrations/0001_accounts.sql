CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  google_sub TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL DEFAULT '',
  email_verified INTEGER NOT NULL DEFAULT 0,
  display_name TEXT NOT NULL DEFAULT 'Jogador',
  avatar_url TEXT NOT NULL DEFAULT '',
  progress_revision INTEGER NOT NULL DEFAULT 0,
  progress_write_token TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS account_stats (
  account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  total INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS account_theme_stats (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  theme TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, theme)
);

CREATE TABLE IF NOT EXISTS game_sessions (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  mode TEXT NOT NULL,
  played_at TEXT NOT NULL,
  turns INTEGER NOT NULL DEFAULT 0,
  outcome TEXT NOT NULL DEFAULT 'training',
  players_json TEXT NOT NULL DEFAULT '[]',
  points INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, id)
);
CREATE INDEX IF NOT EXISTS game_sessions_by_account_date ON game_sessions(account_id, played_at DESC);

CREATE TABLE IF NOT EXISTS answer_errors (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  card_json TEXT NOT NULL,
  chosen TEXT NOT NULL DEFAULT '',
  occurred_at TEXT NOT NULL,
  repeats INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, id)
);
CREATE INDEX IF NOT EXISTS answer_errors_by_account_date ON answer_errors(account_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS custom_decks (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  cards_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  PRIMARY KEY (account_id, id)
);

CREATE TABLE IF NOT EXISTS saved_games (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode = 'solo'),
  state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (account_id, device_id)
);

CREATE TABLE IF NOT EXISTS used_questions (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  PRIMARY KEY (account_id, question_id)
);

CREATE TABLE IF NOT EXISTS guest_imports (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  guest_id TEXT NOT NULL,
  claim_token TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  PRIMARY KEY (account_id, guest_id)
);

CREATE TABLE IF NOT EXISTS account_rooms (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  room_code TEXT NOT NULL,
  player_id TEXT NOT NULL,
  is_host INTEGER NOT NULL DEFAULT 0 CHECK (is_host IN (0, 1)),
  PRIMARY KEY (account_id, room_code, player_id)
);
CREATE INDEX IF NOT EXISTS account_rooms_by_account ON account_rooms(account_id, room_code, player_id, is_host);
