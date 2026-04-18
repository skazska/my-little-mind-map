import { useMemo, useState } from "react";
import type { TopicRelationType, TopicRelationView, TopicView } from "../types";

export interface TopicRelationManagerProps {
    topics: TopicView[];
    relations: TopicRelationView[];
    selectedTopicId: string | null;
    onAddRelation: (sourceTopicId: string, targetTopicId: string, relationType: TopicRelationType) => Promise<void>;
    onRemoveRelation: (sourceTopicId: string, targetTopicId: string) => Promise<void>;
}

const RELATION_TYPES: Array<{ value: TopicRelationType; label: string }> = [
    { value: "subtopic-of", label: "subtopic-of" },
    { value: "related-to", label: "related-to" },
    { value: "classifies", label: "classifies" },
];

export function TopicRelationManager({
    topics,
    relations,
    selectedTopicId,
    onAddRelation,
    onRemoveRelation,
}: TopicRelationManagerProps) {
    const [targetTopicId, setTargetTopicId] = useState("");
    const [relationType, setRelationType] = useState<TopicRelationType>("related-to");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedRelations = useMemo(() => {
        if (!selectedTopicId) return [];
        return relations.filter(
            (relation) =>
                relation.source_topic_id === selectedTopicId ||
                relation.target_topic_id === selectedTopicId,
        );
    }, [relations, selectedTopicId]);

    const availableTargets = useMemo(() => {
        if (!selectedTopicId) return [];
        return topics.filter((topic) => topic.id !== selectedTopicId);
    }, [topics, selectedTopicId]);

    const handleAddRelation = async () => {
        if (!selectedTopicId) {
            setError("Select a topic first.");
            return;
        }
        if (!targetTopicId) {
            setError("Choose a target topic.");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            await onAddRelation(selectedTopicId, targetTopicId, relationType);
            setTargetTopicId("");
        } catch (e) {
            setError(String(e));
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveRelation = async (sourceTopicId: string, targetTopicIdValue: string) => {
        setSaving(true);
        setError(null);
        try {
            await onRemoveRelation(sourceTopicId, targetTopicIdValue);
        } catch (e) {
            setError(String(e));
        } finally {
            setSaving(false);
        }
    };

    if (!selectedTopicId) {
        return (
            <section style={{ border: "1px solid #ddd", borderRadius: 6, padding: "0.9rem" }}>
                <h3 style={{ marginTop: 0 }}>Topic Relations</h3>
                <p style={{ color: "#777" }}>Select a topic to manage relations.</p>
            </section>
        );
    }

    return (
        <section style={{ border: "1px solid #ddd", borderRadius: 6, padding: "0.9rem" }}>
            <h3 style={{ marginTop: 0 }}>Topic Relations</h3>
            {error && (
                <div style={{ color: "red", padding: "0.5rem", background: "#fee", borderRadius: 4, marginBottom: "0.5rem" }}>
                    {error}
                </div>
            )}

            <div style={{ display: "grid", gap: "0.5rem", marginBottom: "0.9rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <select
                        value={targetTopicId}
                        onChange={(e) => setTargetTopicId(e.target.value)}
                        style={{ flex: 1, minWidth: "12rem" }}
                    >
                        <option value="">Select target topic...</option>
                        {availableTargets.map((topic) => (
                            <option key={topic.id} value={topic.id}>
                                {topic.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={relationType}
                        onChange={(e) => setRelationType(e.target.value as TopicRelationType)}
                    >
                        {RELATION_TYPES.map((typeOption) => (
                            <option key={typeOption.value} value={typeOption.value}>
                                {typeOption.label}
                            </option>
                        ))}
                    </select>
                    <button onClick={handleAddRelation} disabled={saving || !targetTopicId}>
                        {saving ? "Saving..." : "Add Relation"}
                    </button>
                </div>
            </div>

            {selectedRelations.length === 0 ? (
                <p style={{ color: "#777" }}>No relations yet for this topic.</p>
            ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.45rem" }}>
                    {selectedRelations.map((relation) => {
                        const outgoing = relation.source_topic_id === selectedTopicId;
                        const label = outgoing
                            ? `${relation.relation_type} ${relation.target_topic_name}`
                            : `${relation.source_topic_name} ${relation.relation_type}`;

                        return (
                            <li key={`${relation.source_topic_id}-${relation.target_topic_id}`} style={{ display: "flex", justifyContent: "space-between", gap: "0.6rem", alignItems: "center", border: "1px solid #eee", borderRadius: 4, padding: "0.45rem" }}>
                                <span>{label}</span>
                                <button
                                    onClick={() =>
                                        handleRemoveRelation(
                                            relation.source_topic_id,
                                            relation.target_topic_id,
                                        )
                                    }
                                    disabled={saving}
                                    style={{ color: "red", background: "none", border: "1px solid red", borderRadius: 4, padding: "0.2rem 0.4rem" }}
                                >
                                    Remove
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
