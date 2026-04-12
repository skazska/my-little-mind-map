import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { NoteEditor } from "./components/NoteEditor";
import type { ViewModel, NoteView, CreateTopicRequest } from "./types";

type View = "list" | "create" | "edit";

interface EditState {
    id: string;
    title: string;
    content: string;
    topicIds: string[];
}

function App() {
    const [vm, setVm] = useState<ViewModel>({ text: "", notes: [], topics: [], error: null });
    const [currentView, setCurrentView] = useState<View>("list");
    const [editState, setEditState] = useState<EditState | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        invoke<ViewModel>("initialize")
            .then((v) => { setVm(v); setLoading(false); })
            .catch((e) => { console.error("init failed:", e); setLoading(false); });
    }, []);

    const handleSaved = useCallback((view: ViewModel) => {
        setVm(view);
        setCurrentView("list");
        setEditState(null);
    }, []);

    const handleCreateTopic = useCallback(async (req: CreateTopicRequest): Promise<ViewModel> => {
        const view = await invoke<ViewModel>("create_topic", {
            name: req.name,
            description: req.description,
        });
        setVm(view);
        return view;
    }, []);

    const openEditor = useCallback((note?: NoteView) => {
        if (note) {
            setEditState({
                id: note.id,
                title: note.title,
                content: note.content_raw,
                topicIds: note.topic_ids,
            });
            setCurrentView("edit");
        } else {
            setEditState(null);
            setCurrentView("create");
        }
    }, []);

    const handleDelete = useCallback(async (id: string) => {
        const view = await invoke<ViewModel>("delete_note", { id });
        setVm(view);
    }, []);

    if (loading) {
        return <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>Loading...</main>;
    }

    if (currentView === "create" || currentView === "edit") {
        return (
            <main style={{ padding: "1rem", fontFamily: "system-ui, sans-serif", height: "100vh", boxSizing: "border-box" }}>
                <NoteEditor
                    topics={vm.topics}
                    editNoteId={editState?.id}
                    editTitle={editState?.title}
                    editContent={editState?.content}
                    editTopicIds={editState?.topicIds}
                    onSaved={handleSaved}
                    onCancel={() => { setCurrentView("list"); setEditState(null); }}
                    onCreateTopic={handleCreateTopic}
                />
            </main>
        );
    }

    return (
        <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h1 style={{ margin: 0 }}>{vm.text || "My Little Mind Map"}</h1>
                <button onClick={() => openEditor()}>+ New Note</button>
            </div>

            {vm.error && (
                <div style={{ color: "red", padding: "0.5rem", background: "#fee", borderRadius: 4, marginBottom: "1rem" }}>
                    {vm.error}
                </div>
            )}

            <section style={{ marginBottom: "2rem" }}>
                <h2>Notes ({vm.notes.length})</h2>
                {vm.notes.length === 0 ? (
                    <p style={{ color: "#888" }}>No notes yet. Create one to get started.</p>
                ) : (
                    <ul style={{ listStyle: "none", padding: 0 }}>
                        {vm.notes.map((n) => (
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
                                }}
                            >
                                <div>
                                    <strong style={{ cursor: "pointer" }} onClick={() => openEditor(n)}>
                                        {n.title}
                                    </strong>
                                    {n.topic_names.length > 0 && (
                                        <span style={{ marginLeft: "0.5rem", color: "#666", fontSize: "0.85rem" }}>
                                            [{n.topic_names.join(", ")}]
                                        </span>
                                    )}
                                    <div style={{ fontSize: "0.8rem", color: "#999" }}>
                                        {new Date(n.updated_at).toLocaleString()}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(n.id)}
                                    style={{ color: "red", background: "none", border: "1px solid red", borderRadius: 4, cursor: "pointer", padding: "0.25rem 0.5rem" }}
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section>
                <h2>Topics ({vm.topics.length})</h2>
                {vm.topics.length === 0 ? (
                    <p style={{ color: "#888" }}>No topics yet. Create one when adding a note.</p>
                ) : (
                    <ul style={{ listStyle: "none", padding: 0, display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {vm.topics.map((t) => (
                            <li
                                key={t.id}
                                style={{
                                    padding: "0.25rem 0.75rem",
                                    background: "#eef",
                                    borderRadius: 12,
                                    fontSize: "0.9rem",
                                }}
                            >
                                {t.name} <span style={{ color: "#888" }}>({t.note_count})</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    );
}

export default App;
