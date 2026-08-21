const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(path.join(dataDir, 'app.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    position INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL,
    due_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Seed default lists on first run.
const listCount = db.prepare('SELECT COUNT(*) AS count FROM lists').get().count;
if (listCount === 0) {
  const insertList = db.prepare('INSERT INTO lists (title, position) VALUES (?, ?)');
  ['To Do', 'In Progress', 'Done'].forEach((title, index) => {
    insertList.run(title, index);
  });
}

module.exports = db;
