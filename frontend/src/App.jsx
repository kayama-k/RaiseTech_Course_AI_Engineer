import { useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { api } from './api';
import Board from './components/Board.jsx';
import Card from './components/Card.jsx';
import CardModal from './components/CardModal.jsx';
import BackgroundPicker from './components/BackgroundPicker.jsx';

// Find which list currently contains a given card id, plus the card itself.
function locateCard(lists, cardId) {
  for (const list of lists) {
    const card = list.cards.find((c) => c.id === cardId);
    if (card) return { list, card };
  }
  return null;
}

const BACKGROUND_STORAGE_KEY = 'taskboard-background';
const DEFAULT_BACKGROUND = { type: 'color', value: '#0079bf' };

function loadStoredBackground() {
  try {
    const raw = localStorage.getItem(BACKGROUND_STORAGE_KEY);
    if (!raw) return DEFAULT_BACKGROUND;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.type === 'color' || parsed.type === 'image') && parsed.value) {
      return parsed;
    }
    return DEFAULT_BACKGROUND;
  } catch {
    return DEFAULT_BACKGROUND;
  }
}

export default function App() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [dragSnapshot, setDragSnapshot] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [background, setBackground] = useState(loadStoredBackground);

  function persistBackground(next) {
    setBackground(next);
    try {
      localStorage.setItem(BACKGROUND_STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      setError('背景画像の保存に失敗しました(ファイルサイズが大きすぎる可能性があります)');
    }
  }

  function handleBackgroundColorChange(color) {
    persistBackground({ type: 'color', value: color });
  }

  function handleBackgroundImageChange(dataUrl) {
    persistBackground({ type: 'image', value: dataUrl });
  }

  function handleBackgroundImageClear() {
    persistBackground(DEFAULT_BACKGROUND);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const loadLists = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getLists();
      setLists(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  // ---- List operations ----
  async function handleAddList(title) {
    const newList = await api.createList(title);
    setLists((prev) => [...prev, newList]);
  }

  async function handleRenameList(listId, title) {
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, title } : l)));
    await api.renameList(listId, title);
  }

  async function handleDeleteList(listId) {
    setLists((prev) => prev.filter((l) => l.id !== listId));
    await api.deleteList(listId);
  }

  // ---- Card operations ----
  async function handleAddCard(listId, { title, description, dueAt }) {
    const card = await api.createCard(listId, { title, description, dueAt });
    setLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, cards: [...l.cards, card] } : l))
    );
  }

  async function handleSaveCard(cardId, patch) {
    const updated = await api.updateCard(cardId, patch);
    setLists((prev) =>
      prev.map((l) => ({
        ...l,
        cards: l.cards.map((c) => (c.id === cardId ? updated : c)),
      }))
    );
    setEditingCard(null);
  }

  async function handleDeleteCard(cardId) {
    setLists((prev) =>
      prev.map((l) => ({ ...l, cards: l.cards.filter((c) => c.id !== cardId) }))
    );
    setEditingCard(null);
    await api.deleteCard(cardId);
  }

  // ---- Drag and drop ----
  function handleDragStart(event) {
    const cardId = event.active.id;
    const found = locateCard(lists, cardId);
    if (found) {
      setActiveCard(found.card);
      setDragSnapshot(lists);
    }
  }

  function handleDragOver(event) {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    setLists((prev) => {
      const source = locateCard(prev, activeId);
      if (!source) return prev;

      // Dropping over another card, or over an empty list's droppable zone.
      const overCard = locateCard(prev, overId);
      const targetListId = overCard ? overCard.list.id : Number(String(overId).replace('list-', ''));
      const targetList = prev.find((l) => l.id === targetListId);
      if (!targetList) return prev;

      if (source.list.id === targetList.id && !overCard) {
        // Hovering the same list's empty area; nothing to change.
        return prev;
      }
      if (source.list.id === targetList.id) return prev; // reordering handled by SortableContext + dragEnd

      // Move card into the target list (append at hovered position or end).
      const withoutCard = source.list.cards.filter((c) => c.id !== activeId);
      const insertIndex = overCard
        ? targetList.cards.findIndex((c) => c.id === overId)
        : targetList.cards.length;

      return prev.map((l) => {
        if (l.id === source.list.id) return { ...l, cards: withoutCard };
        if (l.id === targetList.id) {
          const newCards = [...l.cards];
          newCards.splice(insertIndex, 0, { ...source.card, list_id: targetList.id });
          return { ...l, cards: newCards };
        }
        return l;
      });
    });
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveCard(null);
    const snapshot = dragSnapshot;
    setDragSnapshot(null);
    if (!over) {
      if (snapshot) setLists(snapshot);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    setLists((prev) => {
      // By this point, handleDragOver has already moved the card into
      // whichever list it's currently hovering (cross-list moves happen
      // live). So `source.list` here is always the card's CURRENT list,
      // and this is purely a same-list index correction using the pointer's
      // final position — arrayMove handles both upward and downward moves
      // correctly, unlike a naive filter+splice (which broke downward drags).
      const source = locateCard(prev, activeId);
      if (!source) return prev;
      const currentList = source.list;

      const activeIndex = currentList.cards.findIndex((c) => c.id === activeId);
      const overCard = locateCard(prev, overId);
      let overIndex =
        overCard && overCard.list.id === currentList.id
          ? currentList.cards.findIndex((c) => c.id === overId)
          : currentList.cards.length - 1;
      if (overIndex < 0) overIndex = currentList.cards.length - 1;

      const reordered = arrayMove(currentList.cards, activeIndex, overIndex);
      const nextLists = prev.map((l) => (l.id === currentList.id ? { ...l, cards: reordered } : l));

      // Persist to the backend (fire and forget with error recovery).
      api.moveCard(activeId, currentList.id, overIndex).catch((err) => {
        setError(err.message);
        loadLists();
      });

      return nextLists;
    });
  }

  if (loading) return <div className="status">読み込み中...</div>;

  const appStyle =
    background.type === 'image'
      ? { backgroundImage: `url(${background.value})` }
      : { background: background.value };

  return (
    <div className="app" style={appStyle}>
      <header className="app-header">
        <h1>Task Board</h1>
        <BackgroundPicker
          background={background}
          onChangeColor={handleBackgroundColorChange}
          onChangeImage={handleBackgroundImageChange}
          onClearImage={handleBackgroundImageClear}
        />
      </header>
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <Board
          lists={lists}
          onAddList={handleAddList}
          onRenameList={handleRenameList}
          onDeleteList={handleDeleteList}
          onAddCard={handleAddCard}
          onOpenCard={setEditingCard}
        />
        <DragOverlay>
          {activeCard ? <Card card={activeCard} overlay /> : null}
        </DragOverlay>
      </DndContext>

      {editingCard && (
        <CardModal
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onSave={handleSaveCard}
          onDelete={handleDeleteCard}
        />
      )}
    </div>
  );
}
