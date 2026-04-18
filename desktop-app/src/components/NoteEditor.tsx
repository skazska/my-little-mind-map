import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { MarkdownEditor } from "./MarkdownEditor";
import { TopicSelector } from "./TopicSelector";
import { parseMarkdown } from "../lib/markdown";
import type { ViewModel, TopicView, CreateTopicRequest } from "../types";
import type { Root } from "mdast";

export interface NoteEditorProps {
    topics: TopicView[];
    editNoteId?: string | null;
    editTitle?: string;
    editContent?: string;
    editTopicIds?: string[];
    onSaved: (view: ViewModel) => void;
    onCancel: () => void;
    onCreateTopic: (req: CreateTopicRequest) => Promise<ViewModel>;
}

export function NoteEditor({
    topics,
    editNoteId,
    editTitle,
    editContent,
    editTopicIds,
    onSaved,
    onCancel,
    onCreateTopic,
}: NoteEditorProps) {
    const [title, setTitle] = useState(editTitle ?? "");
    const [contentRaw, setContentRaw] = useState(editContent ?? "");
    const [contentAst, setContentAst] = useState<Root>(() => parseMarkdown(editContent ?? ""));
    const [selectedTopics, setSelectedTopics] = useState<string[]>(editTopicIds ?? []);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [topicError, setTopicError] = useState<string | null>(null);

    const isEdit = !!editNoteId;

    const refreshContent = useCallback((view: ViewModel) => {
        if (!editNoteId) return;
        const updated = view.notes.find((n) => n.id === editNoteId);
        if (updated) {
            setContentRaw(updated.content_raw);
            setContentAst(parseMarkdown(updated.content_raw));
        }
    }, [editNoteId]);

    const handleEditorChange = useCallback((_raw: string, ast: Root) => {
        setContentRaw(_raw);
        setContentAst(ast);
    }, []);

    const handleTopicChange = useCallback((ids: string[]) => {
        setSelectedTopics(ids);
        if (ids.length > 0) setTopicError(null);
    }, []);

    const handleCreateTopic = useCallback(
        async (req: CreateTopicRequest) => {
            const view = await onCreateTopic(req);
            // Auto-select the newly created topic
            const newTopic = view.topics.find(
                (t) => t.name === req.name && !selectedTopics.includes(t.id),
            );
            if (newTopic) {
                setSelectedTopics((prev) => [...prev, newTopic.id]);
            }
        },
        [onCreateTopic, selectedTopics],
    );

    const handleSave = async () => {
        setError(null);
        setTopicError(null);

        if (!title.trim()) {
            setError("Title is required.");
            return;
        }
        if (selectedTopics.length === 0) {
            setTopicError("At least one topic is required.");
            return;
        }

        setSaving(true);
        try {
            let view: ViewModel;
            if (isEdit) {
                view = await invoke<ViewModel>("update_note", {
                    id: editNoteId,
                    title: title.trim(),
                    content: contentRaw,
                    contentAst: JSON.stringify(contentAst),
                    topicIds: selectedTopics,
                });
            } else {
                view = await invoke<ViewModel>("create_note", {
                    title: title.trim(),
                    content: contentRaw,
                    contentAst: JSON.stringify(contentAst),
                    topicIds: selectedTopics,
                });
            }
            if (view.error) {
                setError(view.error);
            } else {
                onSaved(view);
            }
        } catch (e) {
            setError(String(e));
        } finally {
            setSaving(false);
        }
    };

    const handleUpload = async () => {
        if (!isEdit) {
            setError("Please save the note before uploading files.");
            return;
        }
        setError(null);
        try {
            const selected = await open({
                multiple: false,
                filters: [
                    {
                        name: "Supported files",
                        extensions: ["png", "jpg", "jpeg", "gif", "webp", "pdf", "txt"],
                    },
                ],
            });
            if (!selected) return; // user cancelled
            const view = await invoke<ViewModel>("upload_asset", {
                noteId: editNoteId,
                filePath: selected,
            });
            if (view.error) {
                setError(view.error);
            } else {
                refreshContent(view);
                onSaved(view);
            }
        } catch (e) {
            setError(String(e));
        }
    };

    const handleCapture = async () => {
        if (!isEdit) {
            setError("Please save the note before capturing screen.");
            return;
        }
        setError(null);
        try {
            const view = await invoke<ViewModel>("capture_screen", {
                noteId: editNoteId,
            });
            if (view.error) {
                setError(view.error);
            } else {
                refreshContent(view);
                onSaved(view);
            }
        } catch (e) {
            setError(String(e));
        }
    };

    const handleAssetAdded = useCallback(
        (view: ViewModel) => {
            refreshContent(view);
            onSaved(view);
        },
        [refreshContent, onSaved],
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0 }}>{isEdit ? "Edit Note" : "New Note"}</h2>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    {isEdit && (
                        <>
                            <button onClick={handleUpload} title="Upload a file to this note">
                                Upload File
                            </button>
                            <button onClick={handleCapture} title="Capture a screen region">
                                Capture Screen
                            </button>
                        </>
                    )}
                    <button onClick={onCancel}>Cancel</button>
                    <button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>

            {error && <div style={{ color: "red", padding: "0.5rem", background: "#fee", borderRadius: 4 }}>{error}</div>}

            <input
                type="text"
                placeholder="Note title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ fontSize: "1.2rem", padding: "0.5rem", border: "1px solid #ccc", borderRadius: 4 }}
            />

            <TopicSelector
                topics={topics}
                selected={selectedTopics}
                onChange={handleTopicChange}
                onCreateTopic={handleCreateTopic}
                error={topicError}
            />

            <div style={{ flex: 1, minHeight: 0 }}>
                <MarkdownEditor
                    initialContent={contentRaw}
                    onChange={handleEditorChange}
                    noteId={isEdit ? editNoteId : undefined}
                    onAssetAdded={handleAssetAdded}
                />
            </div>
        </div>
    );
}
