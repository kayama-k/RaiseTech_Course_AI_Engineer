import { useState } from 'react';

export default function AddCardForm({ listId, onAdd }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [useDueDate, setUseDueDate] = useState(false);
  const [dueAt, setDueAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setTitle('');
    setUseDueDate(false);
    setDueAt('');
    setOpen(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onAdd(listId, {
        title: trimmed,
        description: '',
        dueAt: useDueDate && dueAt ? dueAt : null,
      });
      reset();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button className="add-card-trigger" onClick={() => setOpen(true)}>
        + カードを追加
      </button>
    );
  }

  return (
    <form className="add-card-form" onSubmit={handleSubmit}>
      <textarea
        autoFocus
        placeholder="カードのタイトルを入力"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
          if (e.key === 'Escape') reset();
        }}
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
      <div className="add-card-actions">
        <button type="submit" className="primary-btn" disabled={submitting}>
          追加
        </button>
        <button type="button" className="text-btn" onClick={reset}>
          ✕
        </button>
      </div>
    </form>
  );
}
