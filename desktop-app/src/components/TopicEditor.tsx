import { useEffect, useState } from "react";
import type { TopicView } from "../types";

export interface TopicEditorProps {
    selectedTopic: TopicView | null;
    onCreate: (name: string, description: string | null) => Promise<void>;
    onUpdate: (id: string, name: string, description: string | null) => Promise<void>;
}

export function TopicEditor({ selectedTopic, onCreate, onUpdate }: TopicEditorProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setName(selectedTopic?.name ?? "");
        setDescription(selectedTopic?.description ?? "");
        setError(null);
    }, [selectedTopic]);

    const handleSubmit = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            setError("Topic name is required.");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            if (selectedTopic) {
                await onUpdate(selectedTopic.id, trimmed, description.trim() || null);
            } else {
                await onCreate(trimmed, description.trim() || null);
                setName("");
                setDescription("");
            }
        } catch (e) {
            setError(String(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <section style={{ border: "1px solid #ddd", borderRadius: 6, padding: "0.9rem" }}>
            <h3 style={{ marginTop: 0 }}>{selectedTopic ? "Edit Topic" : "Create Topic"}</h3>
            {error && (
                <div style={{ color: "red", padding: "0.5rem", background: "#fee", borderRadius: 4, marginBottom: "0.5rem" }}>
                    {error}
                </div>
            )}
            <div style={{ display: "grid", gap: "0.5rem" }}>
                <input
                    type="text"
                    placeholder="Topic name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ padding: "0.45rem 0.5rem" }}
                />
                <textarea
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    style={{ padding: "0.45rem 0.5rem", resize: "vertical" }}
                />
                <button onClick={handleSubmit} disabled={saving}>
                    {saving ? "Saving..." : selectedTopic ? "Update Topic" : "Create Topic"}
                </button>
            </div>
        </section>
    );
}
