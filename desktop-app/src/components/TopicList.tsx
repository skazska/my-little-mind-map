import { useMemo, useState } from "react";
import type { TopicView } from "../types";

export interface TopicListProps {
    topics: TopicView[];
    selectedId: string | null;
    onSelect: (topicId: string) => void;
    onDelete: (topicId: string) => Promise<void>;
}

export function TopicList({ topics, selectedId, onSelect, onDelete }: TopicListProps) {
    const [query, setQuery] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return topics;
        return topics.filter((topic) => topic.name.toLowerCase().includes(q));
    }, [query, topics]);

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await onDelete(id);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <section>
            <h2 style={{ marginTop: 0 }}>Topics ({topics.length})</h2>
            <input
                type="search"
                placeholder="Search topics..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ width: "100%", marginBottom: "0.75rem", padding: "0.4rem 0.5rem" }}
            />

            {filtered.length === 0 ? (
                <p style={{ color: "#888" }}>No topics found.</p>
            ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.5rem" }}>
                    {filtered.map((topic) => (
                        <li
                            key={topic.id}
                            style={{
                                border: selectedId === topic.id ? "2px solid #4477ee" : "1px solid #ddd",
                                borderRadius: 6,
                                padding: "0.6rem",
                                background: selectedId === topic.id ? "#f4f7ff" : "#fff",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                                <button
                                    onClick={() => onSelect(topic.id)}
                                    style={{
                                        border: "none",
                                        background: "none",
                                        textAlign: "left",
                                        cursor: "pointer",
                                        padding: 0,
                                        flex: 1,
                                    }}
                                >
                                    <strong>{topic.name}</strong>
                                    <div style={{ color: "#666", fontSize: "0.82rem" }}>
                                        {topic.note_count} notes
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleDelete(topic.id)}
                                    disabled={deletingId === topic.id}
                                    style={{ color: "red", background: "none", border: "1px solid red", borderRadius: 4, padding: "0.2rem 0.4rem" }}
                                >
                                    {deletingId === topic.id ? "..." : "Delete"}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
