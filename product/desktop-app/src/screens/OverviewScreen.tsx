import { useState } from "react";
import type { Event, LabelSummary, OverviewTab, SpaceSummary } from "../types";

interface Props {
    activeTab: OverviewTab;
    spaces: SpaceSummary[];
    labels: LabelSummary[];
    searchQuery: string;
    dataFolder?: string;
    error?: string;
    dispatch: (e: Event) => void;
}

const TABS: { id: OverviewTab; label: string }[] = [
    { id: "spaces", label: "Spaces" },
    { id: "labels", label: "Labels" },
    { id: "views", label: "Views" },
    { id: "recent", label: "Recent" },
    { id: "search", label: "Search" },
];

export function OverviewScreen({
    activeTab,
    spaces,
    labels,
    searchQuery: _searchQuery,
    dataFolder,
    error,
    dispatch,
}: Props) {
    const [newSpaceName, setNewSpaceName] = useState("");
    const [newSpaceDesc, setNewSpaceDesc] = useState("");
    const [showNewSpace, setShowNewSpace] = useState(false);

    function handleCreateSpace(e: React.FormEvent) {
        e.preventDefault();
        const name = newSpaceName.trim();
        if (!name) return;
        dispatch({
            type: "create_space",
            name,
            description: newSpaceDesc.trim() || undefined,
        });
        setNewSpaceName("");
        setNewSpaceDesc("");
        setShowNewSpace(false);
    }

    return (
        <div className="screen overview">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar__header">
                    <span className="sidebar__title">Mind Map</span>
                </div>
                <nav className="sidebar__tabs">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            className={`sidebar__tab${activeTab === t.id ? " sidebar__tab--active" : ""}`}
                            onClick={() => dispatch({ type: "navigate_overview", tab: t.id })}
                        >
                            {t.label}
                        </button>
                    ))}
                </nav>
                {dataFolder && (
                    <div className="sidebar__footer" title={dataFolder}>
                        📁 {dataFolder.split("/").pop()}
                    </div>
                )}
            </aside>

            {/* Main */}
            <main className="main">
                {error && <div className="banner banner--error">{error}</div>}

                {activeTab === "spaces" && (
                    <div className="tab-content">
                        <div className="tab-content__header">
                            <h2>Spaces</h2>
                            <button
                                className="btn btn--primary"
                                onClick={() => setShowNewSpace((v) => !v)}
                            >
                                + New Space
                            </button>
                        </div>

                        {showNewSpace && (
                            <form className="card form-card" onSubmit={handleCreateSpace}>
                                <input
                                    className="input"
                                    placeholder="Space name"
                                    value={newSpaceName}
                                    onChange={(e) => setNewSpaceName(e.target.value)}
                                    autoFocus
                                />
                                <input
                                    className="input"
                                    placeholder="Description (optional)"
                                    value={newSpaceDesc}
                                    onChange={(e) => setNewSpaceDesc(e.target.value)}
                                />
                                <div className="form-actions">
                                    <button className="btn btn--primary" type="submit">
                                        Create
                                    </button>
                                    <button
                                        className="btn"
                                        type="button"
                                        onClick={() => setShowNewSpace(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        <ul className="card-list">
                            {spaces.map((s) => (
                                <li
                                    key={s.id}
                                    className="card card--clickable"
                                    onClick={() => dispatch({ type: "navigate_to_space", id: s.id })}
                                >
                                    <div className="card__title">{s.name}</div>
                                    {s.description && (
                                        <div className="card__desc">{s.description}</div>
                                    )}
                                    <div className="card__meta">
                                        {s.note_count} note{s.note_count !== 1 ? "s" : ""}
                                        {s.labels.length > 0 && (
                                            <span className="tag-list">
                                                {s.labels.map((l) => (
                                                    <span key={l} className="tag">
                                                        {l}
                                                    </span>
                                                ))}
                                            </span>
                                        )}
                                    </div>
                                </li>
                            ))}
                            {spaces.length === 0 && (
                                <li className="empty">No spaces yet. Create your first one.</li>
                            )}
                        </ul>
                    </div>
                )}

                {activeTab === "labels" && (
                    <div className="tab-content">
                        <h2>Labels</h2>
                        <ul className="card-list">
                            {labels.map((l) => (
                                <li
                                    key={l.label}
                                    className="card card--clickable"
                                    onClick={() =>
                                        dispatch({ type: "set_active_view", labels: [l.label] })
                                    }
                                >
                                    <span className="tag">{l.label}</span>
                                    <span className="card__meta">
                                        {l.note_count} note{l.note_count !== 1 ? "s" : ""}
                                    </span>
                                </li>
                            ))}
                            {labels.length === 0 && (
                                <li className="empty">No labels yet.</li>
                            )}
                        </ul>
                    </div>
                )}

                {(activeTab === "views" ||
                    activeTab === "recent" ||
                    activeTab === "search") && (
                        <div className="tab-content">
                            <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                            <p className="empty">Coming soon.</p>
                        </div>
                    )}
            </main>
        </div>
    );
}
