-- Official decks (bundled content)
CREATE TABLE IF NOT EXISTS decks (
  deck_id    TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  is_premium INTEGER NOT NULL DEFAULT 0, -- 0 = free, 1 = premium
  is_custom  INTEGER NOT NULL DEFAULT 0, -- 0 = official, 1 = user-created
  emoji      TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Questions for official decks
CREATE TABLE IF NOT EXISTS questions (
  id          TEXT PRIMARY KEY,
  deck_id     TEXT NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
  text_en     TEXT NOT NULL,
  intensity   TEXT NOT NULL CHECK (intensity IN ('mild','spicy','wild')),
  sober_text  TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- Custom user-created decks
CREATE TABLE IF NOT EXISTS custom_decks (
  deck_id    TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  emoji      TEXT,
  created_at INTEGER NOT NULL,
  owner_id   TEXT -- optional, for future multi-device sync
);

-- Cards within custom decks
CREATE TABLE IF NOT EXISTS custom_cards (
  id          TEXT PRIMARY KEY,
  deck_id     TEXT NOT NULL REFERENCES custom_decks(deck_id) ON DELETE CASCADE,
  text_en     TEXT NOT NULL,
  intensity   TEXT NOT NULL CHECK (intensity IN ('mild','spicy','wild')),
  sober_text  TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- Session history
CREATE TABLE IF NOT EXISTS sessions (
  session_id    TEXT PRIMARY KEY,
  deck_id       TEXT NOT NULL,
  intensity     TEXT NOT NULL,
  sober_mode    INTEGER NOT NULL DEFAULT 0,
  penalty_label TEXT NOT NULL,
  completed_at  INTEGER NOT NULL,
  duration_sec  INTEGER NOT NULL,
  card_count    INTEGER NOT NULL
);

-- Player details per session
CREATE TABLE IF NOT EXISTS session_players (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  drink_count INTEGER NOT NULL DEFAULT 0
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_deck ON questions(deck_id);
CREATE INDEX IF NOT EXISTS idx_custom_cards_deck ON custom_cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_sessions_deck ON sessions(deck_id);
CREATE INDEX IF NOT EXISTS idx_session_players_session ON session_players(session_id);