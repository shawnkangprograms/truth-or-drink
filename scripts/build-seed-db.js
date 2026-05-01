// scripts/build-seed-db.js
// Builds the bundled seed database from content/*.txt files

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'assets', 'db', 'bambika_seed.db');
const SCHEMA_PATH = path.join(__dirname, 'create-schema.sql');
const CONTENT_DIR = path.join(__dirname, '..', 'content');

// Split a line by tabs or multiple spaces
function splitLine(line) {
  // If there are tabs, use tabs; otherwise split on 2+ spaces
  if (line.includes('\t')) {
    return line.split('\t');
  }
  return line.split(/\s{2,}/).map(s => s.trim());
}

function buildSeedDb() {
  // Ensure output directory exists
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  // Delete old DB if it exists
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Apply schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);
  console.log('Schema applied.');

  // Read all .txt files and insert
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.txt'));
  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split(/\r?\n/);
    if (lines.length < 2) continue; // header only

    // Split header and data lines using the same function
    const header = splitLine(lines[0]);
    const idIndex = header.indexOf('id');
    const intensityIndex = header.indexOf('intensity');
    const mainTextIndex = header.indexOf('main_text');
    const soberTextIndex = header.indexOf('sober_text');
    const deckIndex = header.indexOf('deck');

    if (deckIndex === -1) {
      console.warn(`Skipping ${file}: 'deck' column not found in header`);
      continue;
    }

    const insertDeckStmt = db.prepare(
      `INSERT OR IGNORE INTO decks (deck_id, name, is_premium, is_custom, emoji, sort_order) VALUES (?, ?, 0, 0, '', 0)`
    );
    const insertQuestionStmt = db.prepare(
      `INSERT INTO questions (id, deck_id, text_en, intensity, sober_text, sort_order) VALUES (?, ?, ?, ?, ?, ?)`
    );

    let inserted = 0;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // skip empty lines
      const cols = splitLine(line);
      if (cols.length < Math.max(idIndex, deckIndex, mainTextIndex) + 1) {
        console.warn(`Skipping line ${i + 1} in ${file}: not enough columns`);
        continue;
      }
      const deckId = cols[deckIndex];
      const rawId = cols[idIndex];
      const cardId = deckId + '-' + rawId;  // e.g., "friends-1", "couples-5"
      const intensity = cols[intensityIndex];
      const mainText = cols[mainTextIndex];
      const soberText = cols[soberTextIndex] || '';

      insertDeckStmt.run(deckId, deckId); // deck name same as ID for now
      insertQuestionStmt.run(cardId, deckId, mainText, intensity, soberText, i - 1);
      inserted++;
    }
    console.log(`Inserted ${inserted} cards from ${file}`);
  }

  db.close();
  console.log(`Seed database built: ${DB_PATH}`);
}

buildSeedDb();