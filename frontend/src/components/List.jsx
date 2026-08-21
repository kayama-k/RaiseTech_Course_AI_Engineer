import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import Card from './Card.jsx';
import AddCardForm from './AddCardForm.jsx';

export default function List({ list, onRename, onDelete, onAddCard, onOpenCard }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(list.title);
  const { setNodeRef } = useDroppable({ id: `list-${list.id}` });

  function commitTitle() {
    const trimmed = titleDraft.trim();
    setEditingTitle(false);
    if (trimmed && trimmed !== list.title) {
      onRename(list.id, trimmed);
    } else {
      setTitleDraft(list.title);
    }
  }

  function handleDeleteList() {
    if (list.cards.length > 0) {
      const ok = window.confirm(
        `「${list.title}」には${list.cards.length}件のカードがあります。リストごと削除しますか?`
      );
      if (!ok) return;
    }
    onDelete(list.id);
  }

  return (
    <div className="list">
      <div className="list-header">
        {editingTitle ? (
          <input
            className="list-title-input"
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle();
              if (e.key === 'Escape') {
                setTitleDraft(list.title);
                setEditingTitle(false);
              }
            }}
          />
        ) : (
          <h2 className="list-title" onClick={() => setEditingTitle(true)}>
            {list.title}
          </h2>
        )}
        <button className="icon-btn" title="リストを削除" onClick={handleDeleteList}>
          🗑
        </button>
      </div>

      <div className="card-list" ref={setNodeRef}>
        <SortableContext
          items={list.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {list.cards.map((card) => (
            <Card key={card.id} card={card} onOpen={() => onOpenCard(card)} />
          ))}
        </SortableContext>
      </div>

      <AddCardForm listId={list.id} onAdd={onAddCard} />
    </div>
  );
}
