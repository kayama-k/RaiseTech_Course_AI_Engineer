import { useState } from 'react';

export default function AddListForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onAdd(trimmed);
      setTitle('');
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button className="add-list-trigger" onClick={() => setOpen(true)}>
        + リストを追加
      </button>
    );
  }

  return (
    <form className="add-list-form" onSubmit={handleSubmit}>
      <input
        autoFocus
        placeholder="リスト名を入力"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setTitle('');
            setOpen(false);
          }
        }}
      />
      <div className="add-card-actions">
        <button type="submit" className="primary-btn" disabled={submitting}>
          追加
        </button>
        <button type="button" className="text-btn" onClick={() => setOpen(false)}>
          ✕
        </button>
      </div>
    </form>
  );
}
