import { useState } from "react";
import type { Event, NoteListItem } from "../types";

interface TreeRow {
    note: NoteListItem;
    depth: number;
}

// Flatten the note list into a depth-first ordered tree using parent_id, so the
// note list can render nested child notes indented. [S-DM-N3, S-UX-NLV1]
function orderNoteTree(notes: NoteListItem[]): TreeRow[] {
    const ids = new Set(notes.map((n) => n.id));
    const byParent = new Map<string, NoteListItem[]>();
    const roots: NoteListItem[] = [];
    for (const n of notes) {
        const parent = n.parent_id && ids.has(n.parent_id) ? n.parent_id : null;
        if (parent === null) {
            roots.push(n);
        } else {
            const siblings = byParent.get(parent) ?? [];
            siblings.push(n);
            byParent.set(parent, siblings);
        }
    }
    const rows: TreeRow[] = [];
    const visit = (note: NoteListItem, depth: number) => {
        rows.push({ note, depth });
        for (const child of byParent.get(note.id) ?? []) visit(child, depth + 1);
    };
    for (const root of roots) visit(root, 0);
    return rows;
}

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
                    {spaceId !== "view://active-view" && (
                        <button
                            className="btn btn--primary"
                            data-testid="create-note-btn"
                            onClick={() => dispatch({ type: "create_note", space_id: spaceId })}
                        >
                            + New Note
                        </button>
                    )}
                </div>

                <input
                    className="input search-input"
                    placeholder="Search notes…"
                    value={localSearch}
                    onChange={(e) => handleSearch(e.target.value)}
                    data-testid="note-list-search"
                />

                <ul className="card-list">
                    {orderNoteTree(notes).map(({ note: n, depth }) => (
                        <li
                            key={n.id}
                            className="card card--clickable"
                            data-testid="note-list-item"
                            data-title={n.title}
                            data-depth={depth}
                            style={depth > 0 ? { marginLeft: `${depth * 1.5}rem` } : undefined}
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
                            {spaceId !== "view://active-view" && (
                                <button
                                    className="btn btn--small"
                                    data-testid="add-child-note-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        dispatch({ type: "create_note", space_id: spaceId, parent_id: n.id });
                                    }}
                                >
                                    + Subnote
                                </button>
                            )}
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
