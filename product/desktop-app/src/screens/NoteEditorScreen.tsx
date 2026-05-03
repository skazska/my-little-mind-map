import { useState, useEffect, useRef } from "react";
import type { Event } from "../types";

interface Props {
    id: string;
    title: string;
    content: string;
    labels: string[];
    spaceId?: string;
    draft: boolean;
    error?: string;
    dispatch: (e: Event) => void;
}

export function NoteEditorScreen({
    id,
    title,
    content,
    labels,
    draft,
    error,
    dispatch,
}: Props) {
    const [localContent, setLocalContent] = useState(content);
    const [localLabels, setLocalLabels] = useState<string[]>(labels);
    const [dirty, setDirty] = useState(false);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync incoming content (when note reloads after save).
    useEffect(() => {
        setLocalContent(content);
        setLocalLabels(labels);
        setDirty(false);
    }, [id, content, labels]);

    function handleContentChange(value: string) {
        setLocalContent(value);
        setDirty(true);
        // Auto-save with 1.5 s debounce.
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => save(value, localLabels), 1500);
    }

    function save(c: string, l: string[]) {
        dispatch({ type: "update_note", id, content: c, labels: l });
        setDirty(false);
    }

    function handleSaveNow() {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        save(localContent, localLabels);
    }

    function handlePublish() {
        handleSaveNow();
        dispatch({ type: "publish_note", id });
    }

    function handleDelete() {
        if (confirm("Delete this note?")) {
            dispatch({ type: "delete_note", id });
        }
    }

    function addLabel(label: string) {
        const trimmed = label.trim().toLowerCase();
        if (!trimmed || localLabels.includes(trimmed)) return;
        const updated = [...localLabels, trimmed];
        setLocalLabels(updated);
        save(localContent, updated);
    }

    function removeLabel(label: string) {
        const updated = localLabels.filter((l) => l !== label);
        setLocalLabels(updated);
        save(localContent, updated);
    }

    return (
        <div className="screen note-editor">
            {/* Toolbar */}
            <header className="toolbar">
                <button
                    className="btn btn--back"
                    onClick={() => dispatch({ type: "navigate_back" })}
                >
                    ← Back
                </button>
                <h2 className="toolbar__title">{title}</h2>
                <div className="toolbar__actions">
                    {dirty && <span className="badge badge--unsaved">Unsaved</span>}
                    <button className="btn" onClick={handleSaveNow} disabled={!dirty}>
                        Save
                    </button>
                    {draft && (
                        <button className="btn btn--primary" onClick={handlePublish}>
                            Publish
                        </button>
                    )}
                    <button className="btn btn--danger" onClick={handleDelete}>
                        Delete
                    </button>
                </div>
            </header>

            {error && <div className="banner banner--error">{error}</div>}

            {/* Editor + Metadata panel */}
            <div className="editor-layout">
                {/* Markdown editor */}
                <div className="editor-pane">
                    <textarea
                        className="editor-textarea"
                        value={localContent}
                        onChange={(e) => handleContentChange(e.target.value)}
                        placeholder={`Start writing…\n\nTip: use /:labels tag1 tag2; on a line to set labels.`}
                        spellCheck={false}
                    />
                </div>

                {/* Metadata / labels sidebar */}
                <aside className="metadata-pane">
                    <section className="metadata-section">
                        <h3>Labels</h3>
                        <div className="tag-list">
                            {localLabels.map((l) => (
                                <span key={l} className="tag tag--removable">
                                    {l}
                                    <button
                                        className="tag__remove"
                                        onClick={() => removeLabel(l)}
                                        title="Remove"
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
                        <AddLabelInput onAdd={addLabel} />
                    </section>

                    <section className="metadata-section">
                        <h3>Note ID</h3>
                        <code className="monospace">{id}</code>
                    </section>
                </aside>
            </div>
        </div>
    );
}

function AddLabelInput({ onAdd }: { onAdd: (l: string) => void }) {
    const [value, setValue] = useState("");

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            onAdd(value);
            setValue("");
        }
    }

    return (
        <input
            className="input input--small"
            placeholder="Add label…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
        />
    );
}
