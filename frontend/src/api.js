// Use an absolute URL so this also works when the built frontend is loaded
// via file:// inside Electron (no dev-server proxy available there).
const BASE = 'http://localhost:3001/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      // ignore, use default message
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getLists: () => request('/lists'),
  createList: (title) => request('/lists', { method: 'POST', body: JSON.stringify({ title }) }),
  renameList: (id, title) => request(`/lists/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }),
  deleteList: (id) => request(`/lists/${id}`, { method: 'DELETE' }),

  createCard: (listId, { title, description, dueAt }) =>
    request('/cards', {
      method: 'POST',
      body: JSON.stringify({ list_id: listId, title, description, due_at: dueAt ?? null }),
    }),
  updateCard: (id, { title, description, dueAt }) =>
    request(`/cards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title, description, due_at: dueAt === undefined ? undefined : dueAt }),
    }),
  moveCard: (id, listId, position) =>
    request(`/cards/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ list_id: listId, position }),
    }),
  deleteCard: (id) => request(`/cards/${id}`, { method: 'DELETE' }),
};
