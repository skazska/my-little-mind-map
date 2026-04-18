import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { NoteEditor } from "./components/NoteEditor";
import { NoteList } from "./components/NoteList";
import { TopicList } from "./components/TopicList";
import { TopicEditor } from "./components/TopicEditor";
import { TopicRelationManager } from "./components/TopicRelationManager";
import { StatusBar } from "./components/StatusBar";
import type {
    ViewModel,
    NoteView,
    CreateTopicRequest,
    TopicRelationType,
} from "./types";

type View = "list" | "create" | "edit" | "topics";

interface EditState {
    id: string;
    title: string;
    content: string;
    topicIds: string[];
}

function App() {
    const [vm, setVm] = useState<ViewModel>({ text: "", notes: [], topics: [], topic_relations: [], error: null });
    const [currentView, setCurrentView] = useState<View>("list");
    const [editState, setEditState] = useState<EditState | null>(null);
    const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
    const [commandError, setCommandError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [storagePath, setStoragePath] = useState<string | null>(null);
    const [appVersion, setAppVersion] = useState<string | null>(null);

    useEffect(() => {
        invoke<ViewModel>("initialize")
            .then((v) => { setVm(v); setLoading(false); })
            .catch((e) => { console.error("init failed:", e); setLoading(false); });
        invoke<string>("get_storage_path").then(setStoragePath).catch(console.error);
        getVersion().then(setAppVersion).catch(console.error);
    }, []);

    const handleSaved = useCallback((view: ViewModel) => {
        setVm(view);
        setCurrentView("list");
        setEditState(null);
        setCommandError(null);
    }, []);

    const handleCreateTopic = useCallback(async (req: CreateTopicRequest): Promise<ViewModel> => {
        const view = await invoke<ViewModel>("create_topic", {
            name: req.name,
            description: req.description,
        });
        setVm(view);
        setCommandError(null);
        return view;
    }, []);

    const handleUpdateTopic = useCallback(async (id: string, name: string, description: string | null) => {
        const view = await invoke<ViewModel>("update_topic", { id, name, description });
        setVm(view);
        setCommandError(null);
    }, []);

    const handleDeleteTopic = useCallback(async (id: string) => {
        const view = await invoke<ViewModel>("delete_topic", { id });
        setVm(view);
        setCommandError(null);
        if (selectedTopicId === id) {
            setSelectedTopicId(null);
        }
    }, [selectedTopicId]);

    const handleAddTopicRelation = useCallback(async (sourceTopicId: string, targetTopicId: string, relationType: TopicRelationType) => {
        const view = await invoke<ViewModel>("add_topic_relation", {
            sourceTopicId,
            targetTopicId,
            relationType,
        });
        setVm(view);
        setCommandError(null);
    }, []);

    const handleRemoveTopicRelation = useCallback(async (sourceTopicId: string, targetTopicId: string) => {
        const view = await invoke<ViewModel>("remove_topic_relation", {
            sourceTopicId,
            targetTopicId,
        });
        setVm(view);
        setCommandError(null);
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
        setCommandError(null);
    }, []);

    const selectedTopic = selectedTopicId
        ? vm.topics.find((topic) => topic.id === selectedTopicId) ?? null
        : null;

    let content;

    if (loading) {
        content = (
            <main style={{ flex: 1, minHeight: 0, padding: "2rem" }}>Loading...</main>
        );
    } else if (currentView === "create" || currentView === "edit") {
        content = (
            <main style={{ flex: 1, minHeight: 0, padding: "1rem", overflow: "auto" }}>
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
    } else if (currentView === "topics") {
        content = (
            <main style={{ flex: 1, minHeight: 0, padding: "1.5rem", overflow: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h1 style={{ margin: 0 }}>Topic Management</h1>
                    <button onClick={() => setCurrentView("list")}>Back to Notes</button>
                </div>

                {(vm.error || commandError) && (
                    <div style={{ color: "red", padding: "0.5rem", background: "#fee", borderRadius: 4, marginBottom: "1rem" }}>
                        {commandError ?? vm.error}
                    </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 320px) 1fr", gap: "1rem", alignItems: "start" }}>
                    <TopicList
                        topics={vm.topics}
                        selectedId={selectedTopicId}
                        onSelect={(topicId) => setSelectedTopicId(topicId)}
                        onDelete={async (topicId) => {
                            try {
                                await handleDeleteTopic(topicId);
                            } catch (e) {
                                setCommandError(String(e));
                            }
                        }}
                    />

                    <div style={{ display: "grid", gap: "1rem" }}>
                        <TopicEditor
                            selectedTopic={selectedTopic}
                            onCreate={async (name, description) => {
                                try {
                                    await handleCreateTopic({ name, description });
                                } catch (e) {
                                    setCommandError(String(e));
                                    throw e;
                                }
                            }}
                            onUpdate={async (id, name, description) => {
                                try {
                                    await handleUpdateTopic(id, name, description);
                                } catch (e) {
                                    setCommandError(String(e));
                                    throw e;
                                }
                            }}
                        />

                        <TopicRelationManager
                            topics={vm.topics}
                            relations={vm.topic_relations}
                            selectedTopicId={selectedTopicId}
                            onAddRelation={async (sourceTopicId, targetTopicId, relationType) => {
                                try {
                                    await handleAddTopicRelation(sourceTopicId, targetTopicId, relationType);
                                } catch (e) {
                                    setCommandError(String(e));
                                    throw e;
                                }
                            }}
                            onRemoveRelation={async (sourceTopicId, targetTopicId) => {
                                try {
                                    await handleRemoveTopicRelation(sourceTopicId, targetTopicId);
                                } catch (e) {
                                    setCommandError(String(e));
                                    throw e;
                                }
                            }}
                        />
                    </div>
                </div>
            </main>
        );
    } else {
        content = (
            <main style={{ flex: 1, minHeight: 0, padding: "2rem", overflow: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h1 style={{ margin: 0 }}>{vm.text || "My Little Mind Map"}</h1>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => setCurrentView("topics")}>Manage Topics</button>
                        <button onClick={() => openEditor()}>+ New Note</button>
                    </div>
                </div>

                {(vm.error || commandError) && (
                    <div style={{ color: "red", padding: "0.5rem", background: "#fee", borderRadius: 4, marginBottom: "1rem" }}>
                        {commandError ?? vm.error}
                    </div>
                )}

                <NoteList notes={vm.notes} onOpen={openEditor} onDelete={handleDelete} />

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

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "system-ui, sans-serif" }}>
            {content}
            <StatusBar storagePath={storagePath} noteCount={vm.notes.length} topicCount={vm.topics.length} appVersion={appVersion} />
        </div>
    );
}

export default App;
