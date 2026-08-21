import { useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// dnd-kit swallows the native "click" event that would normally follow a
// pointerdown/pointerup pair on a draggable element (it suppresses the
// trailing click to avoid ghost-clicks after a real drag). Since our cards
// need to open on a plain click, we detect "was this a click, not a drag"
// ourselves by comparing pointerdown/pointerup coordinates instead of
// relying on the native click event.
const CLICK_MOVE_THRESHOLD = 5;

// Format an ISO datetime-local string ("2026-08-25T10:00") for display,
// and classify it relative to now for the badge color.
function describeDueDate(dueAt) {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return null;
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  let status = 'upcoming';
  if (diffMs < 0) status = 'overdue';
  else if (diffMs <= oneDayMs) status = 'soon';

  const label = due.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return { status, label };
}

export default function Card({ card, onOpen, overlay = false }) {
  const sortable = useSortable({ id: card.id, disabled: overlay });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;
  const pointerDownPos = useRef(null);

  const style = overlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      };

  const due = describeDueDate(card.due_at);

  function handlePointerDown(event) {
    pointerDownPos.current = { x: event.clientX, y: event.clientY };
    listeners?.onPointerDown?.(event);
  }

  function handlePointerUp(event) {
    const start = pointerDownPos.current;
    pointerDownPos.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.hypot(dx, dy) < CLICK_MOVE_THRESHOLD) {
      onOpen();
    }
  }

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      className={`card${overlay ? ' card-overlay' : ''}`}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onPointerDown={overlay ? undefined : handlePointerDown}
      onPointerUp={overlay ? undefined : handlePointerUp}
      onClick={overlay ? undefined : onOpen}
    >
      <div className="card-title">{card.title}</div>
      {card.description && <div className="card-description">{card.description}</div>}
      {due && (
        <div className={`card-due card-due--${due.status}`}>
          🕒 {due.label}
        </div>
      )}
    </div>
  );
}
