import { useMemo, useState } from "react";
import type { NoteView, TopicView, TopicRelationView } from "../types";

export interface TopicBrowserProps {
    topics: TopicView[];
    notes: NoteView[];
    relations: TopicRelationView[];
    selectedTopicId: string | null;
    onSelectTopic: (topicId: string) => void;
    onClearFilter: () => void;
    onOpenNote: (note: NoteView) => void;
}

interface RelatedTopicItem {
    id: string;
    name: string;
    noteCount: number;
}

export function TopicBrowser({
    topics,
    notes,
    relations,
    selectedTopicId,
    onSelectTopic,
    onClearFilter,
    onOpenNote,
}: TopicBrowserProps) {
    const [query, setQuery] = useState("");

    const filteredTopics = useMemo(() => {
        const q = query.trim().toLowerCase();
        const sorted = [...topics].sort((a, b) => a.name.localeCompare(b.name));
        if (!q) return sorted;
        return sorted.filter((t) => t.name.toLowerCase().includes(q));
    }, [topics, query]);

    const selectedTopic = useMemo(
        () => topics.find((t) => t.id === selectedTopicId) ?? null,
        [topics, selectedTopicId],
    );

    const filteredNotes = useMemo(() => {
        if (!selectedTopicId) return notes;
        return notes.filter((n) => n.topic_ids.includes(selectedTopicId));
    }, [notes, selectedTopicId]);

    const topicById = useMemo(() => {
        const map = new Map<string, TopicView>();
        for (const t of topics) map.set(t.id, t);
        return map;
    }, [topics]);

    const { subtopics, parentTopics, relatedTopics, classifyingTopics } = useMemo(() => {
        if (!selectedTopicId) {
            return { subtopics: [], parentTopics: [], relatedTopics: [], classifyingTopics: [] };
        }

        const subs: RelatedTopicItem[] = [];
        const parents: RelatedTopicItem[] = [];
        const related: RelatedTopicItem[] = [];
        const classifying: RelatedTopicItem[] = [];

        for (const r of relations) {
            if (r.relation_type === "subtopic-of") {
                // source is subtopic-of target
                if (r.target_topic_id === selectedTopicId) {
                    const t = topicById.get(r.source_topic_id);
                    if (t) subs.push({ id: t.id, name: t.name, noteCount: t.note_count });
                } else if (r.source_topic_id === selectedTopicId) {
                    const t = topicById.get(r.target_topic_id);
                    if (t) parents.push({ id: t.id, name: t.name, noteCount: t.note_count });
                }
            } else if (r.relation_type === "related-to") {
                if (r.source_topic_id === selectedTopicId) {
                    const t = topicById.get(r.target_topic_id);
                    if (t) related.push({ id: t.id, name: t.name, noteCount: t.note_count });
                } else if (r.target_topic_id === selectedTopicId) {
                    const t = topicById.get(r.source_topic_id);
                    if (t) related.push({ id: t.id, name: t.name, noteCount: t.note_count });
                }
            } else if (r.relation_type === "classifies") {
                // source classifies target
                if (r.target_topic_id === selectedTopicId) {
                    const t = topicById.get(r.source_topic_id);
                    if (t) classifying.push({ id: t.id, name: t.name, noteCount: t.note_count });
                }
            }
        }

        return { subtopics: subs, parentTopics: parents, relatedTopics: related, classifyingTopics: classifying };
    }, [selectedTopicId, relations, topicById]);

    return (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 280px) 1fr", gap: "1rem", height: "100%" }}>
            {/* Left panel: topic list */}
            <section style={{ borderRight: "1px solid #ddd", paddingRight: "1rem", overflow: "auto" }}>
                <h2 style={{ marginTop: 0 }}>Topics ({topics.length})</h2>
                <input
                    type="search"
                    placeholder="Search topics..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ width: "100%", marginBottom: "0.75rem", padding: "0.4rem 0.5rem", boxSizing: "border-box" }}
                />
                {selectedTopicId && (
                    <button
                        onClick={onClearFilter}
                        style={{ width: "100%", marginBottom: "0.75rem", padding: "0.3rem", cursor: "pointer" }}
                    >
                        Show All Notes
                    </button>
                )}
                {filteredTopics.length === 0 ? (
                    <p style={{ color: "#888" }}>No topics found.</p>
                ) : (
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.4rem" }}>
                        {filteredTopics.map((topic) => (
                            <li key={topic.id}>
                                <button
                                    onClick={() => onSelectTopic(topic.id)}
                                    aria-pressed={selectedTopicId === topic.id}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        textAlign: "left",
                                        border: selectedTopicId === topic.id ? "2px solid #4477ee" : "1px solid #ddd",
                                        borderRadius: 6,
                                        padding: "0.5rem",
                                        background: selectedTopicId === topic.id ? "#f4f7ff" : "#fff",
                                        cursor: "pointer",
                                    }}
                                >
                                    <strong>{topic.name}</strong>
                                    <div style={{ color: "#666", fontSize: "0.82rem" }}>
                                        {topic.note_count} {topic.note_count === 1 ? "note" : "notes"}
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Right panel: topic detail + filtered notes */}
            <section style={{ overflow: "auto" }}>
                {selectedTopic ? (
                    <>
                        <h2 style={{ marginTop: 0 }}>{selectedTopic.name}</h2>
                        {selectedTopic.description && (
                            <p style={{ color: "#555", marginTop: 0 }}>{selectedTopic.description}</p>
                        )}

                        {/* Relation sections */}
                        <TopicRelationSection label="Subtopics" items={subtopics} onSelect={onSelectTopic} />
                        <TopicRelationSection label="Parent Topics" items={parentTopics} onSelect={onSelectTopic} />
                        <TopicRelationSection label="Related Topics" items={relatedTopics} onSelect={onSelectTopic} />
                        <TopicRelationSection label="Classifying Topics" items={classifyingTopics} onSelect={onSelectTopic} />

                        <h3>Notes ({filteredNotes.length})</h3>
                        <NoteListCompact notes={filteredNotes} onOpen={onOpenNote} />
                    </>
                ) : (
                    <>
                        <h2 style={{ marginTop: 0 }}>All Notes ({notes.length})</h2>
                        <p style={{ color: "#888" }}>Select a topic to filter notes and see relations.</p>
                        <NoteListCompact notes={filteredNotes} onOpen={onOpenNote} />
                    </>
                )}
            </section>
        </div>
    );
}

function TopicRelationSection({
    label,
    items,
    onSelect,
}: {
    label: string;
    items: RelatedTopicItem[];
    onSelect: (id: string) => void;
}) {
    if (items.length === 0) return null;
    return (
        <div style={{ marginBottom: "0.75rem" }}>
            <h4 style={{ margin: "0.5rem 0 0.25rem" }}>{label}</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {items.map((item) => (
                    <li key={item.id}>
                        <button
                            onClick={() => onSelect(item.id)}
                            style={{
                                padding: "0.2rem 0.6rem",
                                background: "#eef",
                                border: "1px solid #cce",
                                borderRadius: 12,
                                cursor: "pointer",
                                fontSize: "0.85rem",
                            }}
                        >
                            {item.name} <span style={{ color: "#888" }}>({item.noteCount})</span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function NoteListCompact({
    notes,
    onOpen,
}: {
    notes: NoteView[];
    onOpen: (note: NoteView) => void;
}) {
    if (notes.length === 0) {
        return <p style={{ color: "#888" }}>No notes classified under this topic.</p>;
    }
    return (
        <ul style={{ listStyle: "none", padding: 0 }}>
            {notes.map((n) => (
                <li
                    key={n.id}
                    style={{
                        padding: "0.6rem 0.75rem",
                        border: "1px solid #ddd",
                        borderRadius: 4,
                        marginBottom: "0.4rem",
                    }}
                >
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
                </li>
            ))}
        </ul>
    );
}
