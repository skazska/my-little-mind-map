import { useState, useRef } from "react";
import type { Event } from "../types";

interface Props {
    id: string;
    title: string;
    content: string;
    labels: string[];
    spaceId?: string;
    draft: boolean;
    uuid: string;
    created_at: string;
    updated_at: string;
    error?: string;
    dispatch: (e: Event) => void;
}

export function NoteEditorScreen({
    id,
    title,
    content,
    labels,
    draft,
    uuid,
    created_at,
    updated_at,
    error,
    dispatch,
}: Props) {
    const [localContent, setLocalContent] = useState(content);
    const [localLabels, setLocalLabels] = useState<string[]>(labels);
    const [dirty, setDirty] = useState(false);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Reset local state when navigating to a different note.
    const [prevId, setPrevId] = useState(id);
    if (prevId !== id) {
        setPrevId(id);
        setLocalContent(content);
        setLocalLabels(labels);
        setDirty(false);
    }

    function handleContentChange(value: string) {
        setLocalContent(value);
        setDirty(true);
        // Auto-save with 10 s debounce.
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => save(value, localLabels), 10000);
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
        <div className="screen note-editor" data-screen="note_editor">
            {/* Toolbar */}
            <header className="toolbar">
                <button
                    className="btn btn--back"
                    data-testid="back-btn"
                    onClick={() => dispatch({ type: "navigate_back" })}
                >
                    ← Back
                </button>
                <h2 className="toolbar__title">{title}</h2>
                <div className="toolbar__actions">
                    {dirty && <span className="badge badge--unsaved" data-testid="dirty-indicator">Unsaved</span>}
                    <button className="btn" data-testid="save-note-btn" onClick={handleSaveNow} disabled={!dirty}>
                        Save
                    </button>
                    {draft && (
                        <button className="btn btn--primary" data-testid="publish-note-btn" onClick={handlePublish}>
                            Publish
                        </button>
                    )}
                    <button className="btn btn--danger" data-testid="delete-note-btn" onClick={handleDelete}>
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
                        data-testid="note-editor-content"
                        value={localContent}
                        onChange={(e) => handleContentChange(e.target.value)}
                        placeholder={`Start writing…\n\nTip: use /:labels tag1 tag2; on a line to set labels.`}
                        spellCheck={false}
                    />
                </div>

                {/* Metadata / labels sidebar */}
                <aside className="metadata-pane">
                    <section className="metadata-section">
                        <h3 data-testid="metadata-title">{title}</h3>
                    </section>

                    <section className="metadata-section">
                        <h3>Labels</h3>
                        <div className="tag-list">
                            {localLabels.map((l) => (
                                <span key={l} className="tag tag--removable" data-testid="label-chip" data-label={l}>
                                    {l}
                                    <button
                                        className="tag__remove"
                                        data-testid="label-remove-btn"
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
                        <code className="monospace" data-testid="metadata-uuid">{uuid}</code>
                    </section>

                    <section className="metadata-section">
                        <div data-testid="metadata-created-at">{created_at.slice(0, 10)}</div>
                        <div data-testid="metadata-updated-at">{updated_at.slice(0, 10)}</div>
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
            data-testid="metadata-label-input"
        />
    );
}
