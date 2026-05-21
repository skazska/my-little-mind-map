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
    const [localSearch, setLocalSearch] = useState(searchQuery);

    function handleSearch(q: string) {
        setLocalSearch(q);
        dispatch({ type: "search_changed", query: q });
    }

    return (
        <div className="screen note-list" data-screen="note_list">
            {/* Sidebar */}
            <aside className="sidebar">
                <button
                    className="btn btn--back"
                    data-testid="back-btn"
                    onClick={() => dispatch({ type: "navigate_back" })}
                >
                    ← Back
                </button>
                <div className="sidebar__header">
                    <span className="sidebar__title">{spaceName}</span>
                </div>
                {activeViewLabels.length > 0 && (
                    <div className="sidebar__filter">
                        <span data-testid="active-view-badge" className="label">View:</span>
                        {activeViewLabels.map((l) => (
                            <span key={l} className="tag">
                                {l}
                            </span>
                        ))}
                        <button
                            data-testid="clear-view-btn"
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
                        data-testid="create-note-btn"
                        onClick={() => dispatch({ type: "create_note", space_id: spaceId })}
                    >
                        + New Note
                    </button>
                </div>

                <input
                    className="input search-input"
                    placeholder="Search notes…"
                    value={localSearch}
                    onChange={(e) => handleSearch(e.target.value)}
                    data-testid="note-list-search"
                />

                <ul className="card-list">
                    {notes.map((n) => (
                        <li
                            key={n.id}
                            className="card card--clickable"
                            data-testid="note-list-item"
                            data-title={n.title}
                            onClick={() => dispatch({ type: "navigate_to_note", id: n.id })}
                        >
                            <div className="card__title" data-testid="note-title">
                                {n.title}
                                {n.draft && <span className="badge badge--draft" data-testid="draft-badge">Draft</span>}
                            </div>
                            {n.description && (
                                <div className="card__desc">{n.description}</div>
                            )}
                            <div className="card__meta">
                                <span className="card__date" data-testid="note-date">{n.updated_at.slice(0, 10)}</span>
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
