import { useMemo, useState } from "react";
import type { NoteView } from "../types";

export interface NoteListProps {
    notes: NoteView[];
    onOpen: (note: NoteView) => void;
    onDelete: (id: string) => Promise<void>;
}

type SortBy = "updated_desc" | "title_asc";

export function NoteList({ notes, onOpen, onDelete }: NoteListProps) {
    const [query, setQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortBy>("updated_desc");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const base = q
            ? notes.filter((n) => n.title.toLowerCase().includes(q))
            : notes;

        const sorted = [...base];
        if (sortBy === "title_asc") {
            sorted.sort((a, b) => a.title.localeCompare(b.title));
        } else {
            sorted.sort((a, b) =>
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
            );
        }
        return sorted;
    }, [notes, query, sortBy]);

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await onDelete(id);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <section style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <h2 style={{ margin: 0 }}>Notes ({notes.length})</h2>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                        type="search"
                        placeholder="Search title..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{ padding: "0.4rem 0.5rem", minWidth: "16rem" }}
                    />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
                        <option value="updated_desc">Most recent</option>
                        <option value="title_asc">Title (A-Z)</option>
                    </select>
                </div>
            </div>

            {filtered.length === 0 ? (
                <p style={{ color: "#888" }}>
                    {notes.length === 0 ? "No notes yet. Create one to get started." : "No notes match your search."}
                </p>
            ) : (
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {filtered.map((n) => (
                        <li
                            key={n.id}
                            style={{
                                padding: "0.75rem",
                                border: "1px solid #ddd",
                                borderRadius: 4,
                                marginBottom: "0.5rem",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "0.75rem",
                            }}
                        >
                            <div>
                                <button
                                    type="button"
                                    onClick={() => onOpen(n)}
                                    aria-label={`Open note ${n.title}`}
                                    style={{
                                        cursor: "pointer",
                                        background: "none",
                                        border: "none",
                                        padding: 0,
                                        fontWeight: "bold",
                                    }}
                                >
                                    {n.title}
                                </button>
                                {n.topic_names.length > 0 && (
                                    <span style={{ marginLeft: "0.5rem", color: "#666", fontSize: "0.85rem" }}>
                                        [{n.topic_names.join(", ")}]
                                    </span>
                                )}
                                <div style={{ fontSize: "0.8rem", color: "#999" }}>
                                    Updated: {new Date(n.updated_at).toLocaleString()}
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(n.id)}
                                disabled={deletingId === n.id}
                                style={{
                                    color: "red",
                                    background: "none",
                                    border: "1px solid red",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                    padding: "0.25rem 0.5rem",
                                }}
                            >
                                {deletingId === n.id ? "Deleting..." : "Delete"}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
