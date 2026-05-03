import { useState } from "react";
import type { Event, NoteListItem } from "../types";

interface Props {
  spaceId: string;
  spaceName: string;
  notes: NoteListItem[];
  searchQuery: string;
  activeViewLabels: string[];
  error?: string;
  dispatch: (e: Event) => void;
}

export function NoteListScreen({
  spaceId,
  spaceName,
  notes,
  searchQuery,
  activeViewLabels,
  error,
  dispatch,
}: Props) {
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  function handleCreateNote(e: React.FormEvent) {
    e.preventDefault();
    const title = newNoteTitle.trim();
    if (!title) return;
    dispatch({ type: "create_note", title, space_id: spaceId });
    setNewNoteTitle("");
    setShowNew(false);
  }

  function handleSearch(q: string) {
    setLocalSearch(q);
    dispatch({ type: "search_changed", query: q });
  }

  return (
    <div className="screen note-list">
      {/* Sidebar */}
      <aside className="sidebar">
        <button
          className="btn btn--back"
          onClick={() => dispatch({ type: "navigate_back" })}
        >
          ← Back
        </button>
        <div className="sidebar__header">
          <span className="sidebar__title">{spaceName}</span>
        </div>
        {activeViewLabels.length > 0 && (
          <div className="sidebar__filter">
            <span className="label">View:</span>
            {activeViewLabels.map((l) => (
              <span key={l} className="tag">
                {l}
              </span>
            ))}
            <button
              className="btn btn--small"
              onClick={() => dispatch({ type: "clear_view" })}
            >
              ✕
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="main">
        {error && <div className="banner banner--error">{error}</div>}
        <div className="tab-content__header">
          <h2>Notes</h2>
          <button
            className="btn btn--primary"
            onClick={() => setShowNew((v) => !v)}
          >
            + New Note
          </button>
        </div>

        <input
          className="input search-input"
          placeholder="Search notes…"
          value={localSearch}
          onChange={(e) => handleSearch(e.target.value)}
        />

        {showNew && (
          <form className="card form-card" onSubmit={handleCreateNote}>
            <input
              className="input"
              placeholder="Note title"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              autoFocus
            />
            <div className="form-actions">
              <button className="btn btn--primary" type="submit">
                Create
              </button>
              <button
                className="btn"
                type="button"
                onClick={() => setShowNew(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <ul className="card-list">
          {notes.map((n) => (
            <li
              key={n.id}
              className="card card--clickable"
              onClick={() => dispatch({ type: "navigate_to_note", id: n.id })}
            >
              <div className="card__title">
                {n.title}
                {n.draft && <span className="badge badge--draft">Draft</span>}
              </div>
              {n.description && (
                <div className="card__desc">{n.description}</div>
              )}
              <div className="card__meta">
                <span className="card__date">{n.updated_at.slice(0, 10)}</span>
                {n.labels.length > 0 && (
                  <span className="tag-list">
                    {n.labels.map((l) => (
                      <span key={l} className="tag">
                        {l}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            </li>
          ))}
          {notes.length === 0 && (
            <li className="empty">No notes yet. Create your first one.</li>
          )}
        </ul>
      </main>
    </div>
  );
}
