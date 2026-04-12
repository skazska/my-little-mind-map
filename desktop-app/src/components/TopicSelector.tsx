import type { TopicView, CreateTopicRequest } from "../types";
import { useState } from "react";

export interface TopicSelectorProps {
    topics: TopicView[];
    selected: string[];
    onChange: (ids: string[]) => void;
    onCreateTopic?: (req: CreateTopicRequest) => void;
    error?: string | null;
}

export function TopicSelector({ topics, selected, onChange, onCreateTopic, error }: TopicSelectorProps) {
    const [newTopicName, setNewTopicName] = useState("");

    const toggle = (id: string) => {
        if (selected.includes(id)) {
            onChange(selected.filter((s) => s !== id));
        } else {
            onChange([...selected, id]);
        }
    };

    const handleCreate = () => {
        const name = newTopicName.trim();
        if (name && onCreateTopic) {
            onCreateTopic({ name, description: null });
            setNewTopicName("");
        }
    };

    return (
        <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>
                Topics *
            </label>
            {error && <div style={{ color: "red", fontSize: "0.85rem", marginBottom: "0.25rem" }}>{error}</div>}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    marginBottom: "0.5rem",
                }}
            >
                {topics.map((t) => (
                    <label key={t.id} style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={selected.includes(t.id)}
                            onChange={() => toggle(t.id)}
                        />
                        {t.name}
                    </label>
                ))}
                {topics.length === 0 && <span style={{ color: "#888" }}>No topics yet — create one below.</span>}
            </div>
            {onCreateTopic && (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                        type="text"
                        placeholder="New topic name"
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        style={{ flex: 1, padding: "0.25rem 0.5rem" }}
                    />
                    <button onClick={handleCreate} disabled={!newTopicName.trim()}>
                        Add Topic
                    </button>
                </div>
            )}
        </div>
    );
}
