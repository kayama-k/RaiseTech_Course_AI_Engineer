import { useState } from 'react';

export default function CardModal({ card, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [useDueDate, setUseDueDate] = useState(Boolean(card.due_at));
  const [dueAt, setDueAt] = useState(card.due_at || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onSave(card.id, {
        title: trimmed,
        description: description.trim(),
        dueAt: useDueDate && dueAt ? dueAt : null,
      });
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (window.confirm('このカードを削除しますか?')) {
      onDelete(card.id);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <label className="field-label">タイトル</label>
        <input
          className="modal-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        <label className="field-label">説明</label>
        <textarea
          className="modal-description-input"
          rows={4}
          placeholder="詳細を入力(任意)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label className="due-toggle">
          <input
            type="checkbox"
            checked={useDueDate}
            onChange={(e) => setUseDueDate(e.target.checked)}
          />
          予定日時を設定する
        </label>
        {useDueDate && (
          <input
            type="datetime-local"
            min="2000-01-01T00:00"
            max="2100-12-31T23:59"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
        )}

        <div className="modal-actions">
          <button className="primary-btn" onClick={handleSave} disabled={saving}>
            保存
          </button>
          <button className="danger-btn" onClick={handleDelete}>
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
