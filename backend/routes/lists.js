const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/lists - all lists with their cards, ordered by position
router.get('/', (req, res) => {
  const lists = db.prepare('SELECT * FROM lists ORDER BY position').all();
  const cardStmt = db.prepare('SELECT * FROM cards WHERE list_id = ? ORDER BY position');
  const result = lists.map((list) => ({
    ...list,
    cards: cardStmt.all(list.id),
  }));
  res.json(result);
});

// POST /api/lists - create a new list at the end
router.post('/', (req, res) => {
  const title = (req.body.title || '').trim();
  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) AS maxPos FROM lists').get().maxPos;
  const info = db.prepare('INSERT INTO lists (title, position) VALUES (?, ?)').run(title, maxPos + 1);
  const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ ...list, cards: [] });
});

// PATCH /api/lists/:id - rename a list
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM lists WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'list not found' });
  }
  const title = req.body.title !== undefined ? req.body.title.trim() : existing.title;
  if (!title) {
    return res.status(400).json({ error: 'title cannot be empty' });
  }
  db.prepare('UPDATE lists SET title = ? WHERE id = ?').run(title, id);
  res.json(db.prepare('SELECT * FROM lists WHERE id = ?').get(id));
});

// DELETE /api/lists/:id - delete a list and its cards
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM lists WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'list not found' });
  }
  db.prepare('DELETE FROM cards WHERE list_id = ?').run(id);
  db.prepare('DELETE FROM lists WHERE id = ?').run(id);
  res.status(204).end();
});

module.exports = router;
