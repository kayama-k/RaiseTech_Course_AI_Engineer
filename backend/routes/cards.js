const express = require('express');
const db = require('../db');

const router = express.Router();

// Normalize an incoming due_at value: '' or null/undefined -> null (no due date),
// otherwise pass through the ISO datetime string as-is.
function normalizeDueAt(value) {
  if (value === undefined) return undefined; // not provided -> leave unchanged
  if (value === null || value === '') return null; // explicitly cleared
  return value;
}

// POST /api/cards - create a card at the end of a list
router.post('/', (req, res) => {
  const listId = Number(req.body.list_id);
  const title = (req.body.title || '').trim();
  const description = (req.body.description || '').trim();
  const dueAt = normalizeDueAt(req.body.due_at) ?? null;

  if (!listId || !title) {
    return res.status(400).json({ error: 'list_id and title are required' });
  }
  const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(listId);
  if (!list) {
    return res.status(404).json({ error: 'list not found' });
  }

  const maxPos = db
    .prepare('SELECT COALESCE(MAX(position), -1) AS maxPos FROM cards WHERE list_id = ?')
    .get(listId).maxPos;
  const info = db
    .prepare('INSERT INTO cards (list_id, title, description, position, due_at) VALUES (?, ?, ?, ?, ?)')
    .run(listId, title, description, maxPos + 1, dueAt);
  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(card);
});

// PATCH /api/cards/:id - edit title/description/due_at
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'card not found' });
  }
  const title = req.body.title !== undefined ? req.body.title.trim() : existing.title;
  const description = req.body.description !== undefined ? req.body.description.trim() : existing.description;
  const dueAt = normalizeDueAt(req.body.due_at);
  const nextDueAt = dueAt === undefined ? existing.due_at : dueAt;
  if (!title) {
    return res.status(400).json({ error: 'title cannot be empty' });
  }
  db.prepare('UPDATE cards SET title = ?, description = ?, due_at = ? WHERE id = ?').run(
    title,
    description,
    nextDueAt,
    id
  );
  res.json(db.prepare('SELECT * FROM cards WHERE id = ?').get(id));
});

// PATCH /api/cards/:id/move - move a card to a list/position (drag & drop)
router.patch('/:id/move', (req, res) => {
  const id = Number(req.params.id);
  const targetListId = Number(req.body.list_id);
  const targetPosition = Number(req.body.position);

  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
  if (!card) {
    return res.status(404).json({ error: 'card not found' });
  }
  const targetList = db.prepare('SELECT * FROM lists WHERE id = ?').get(targetListId);
  if (!targetList || Number.isNaN(targetPosition)) {
    return res.status(400).json({ error: 'valid list_id and position are required' });
  }

  const updatePos = db.prepare('UPDATE cards SET position = ? WHERE id = ?');
  const updatePosAndList = db.prepare('UPDATE cards SET position = ?, list_id = ? WHERE id = ?');

  db.exec('BEGIN');
  try {
    if (card.list_id === targetListId) {
      const siblings = db
        .prepare('SELECT * FROM cards WHERE list_id = ? AND id != ? ORDER BY position')
        .all(targetListId, id);
      const clamped = Math.max(0, Math.min(targetPosition, siblings.length));
      siblings.splice(clamped, 0, card);
      siblings.forEach((c, idx) => updatePos.run(idx, c.id));
    } else {
      const sourceSiblings = db
        .prepare('SELECT * FROM cards WHERE list_id = ? AND id != ? ORDER BY position')
        .all(card.list_id, id);
      sourceSiblings.forEach((c, idx) => updatePos.run(idx, c.id));

      const targetSiblings = db
        .prepare('SELECT * FROM cards WHERE list_id = ? ORDER BY position')
        .all(targetListId);
      const clamped = Math.max(0, Math.min(targetPosition, targetSiblings.length));
      targetSiblings.splice(clamped, 0, card);
      targetSiblings.forEach((c, idx) => {
        updatePosAndList.run(idx, targetListId, c.id);
      });
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  res.json(db.prepare('SELECT * FROM cards WHERE id = ?').get(id));
});

// DELETE /api/cards/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'card not found' });
  }
  db.prepare('DELETE FROM cards WHERE id = ?').run(id);
  // Close the position gap left in the source list.
  const remaining = db
    .prepare('SELECT * FROM cards WHERE list_id = ? ORDER BY position')
    .all(existing.list_id);
  const updatePos = db.prepare('UPDATE cards SET position = ? WHERE id = ?');
  remaining.forEach((c, idx) => updatePos.run(idx, c.id));
  res.status(204).end();
});

module.exports = router;
