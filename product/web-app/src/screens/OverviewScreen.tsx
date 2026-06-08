import { useState } from "react";
import type { Event, LabelSummary, OverviewTab, SpaceSummary } from "../types";

interface SpaceRow {
  space: SpaceSummary;
  depth: number;
}

// Flatten spaces into a depth-first ordered tree using parent_id so nested child
// spaces render indented. @(S-DM-S1,S-UX-SA1)
function orderSpaceTree(spaces: SpaceSummary[]): SpaceRow[] {
  const ids = new Set(spaces.map((s) => s.id));
  const byParent = new Map<string, SpaceSummary[]>();
  const roots: SpaceSummary[] = [];
  for (const s of spaces) {
    const parent = s.parent_id && ids.has(s.parent_id) ? s.parent_id : null;
    if (parent === null) {
      roots.push(s);
    } else {
      const siblings = byParent.get(parent) ?? [];
      siblings.push(s);
      byParent.set(parent, siblings);
    }
  }
  const rows: SpaceRow[] = [];
  const visit = (space: SpaceSummary, depth: number) => {
    rows.push({ space, depth });
    for (const child of byParent.get(space.id) ?? []) visit(child, depth + 1);
  };
  for (const root of roots) visit(root, 0);
  return rows;
}

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
  const [parentForNew, setParentForNew] = useState<string | null>(null);

  function handleCreateSpace(e: React.FormEvent) {
    e.preventDefault();
    const name = newSpaceName.trim();
    if (!name) return;
    dispatch({
      type: "create_space",
      name,
      description: newSpaceDesc.trim() || undefined,
      parent_id: parentForNew ?? undefined,
    });
    setNewSpaceName("");
    setNewSpaceDesc("");
    setShowNewSpace(false);
    setParentForNew(null);
  }

  return (
    <div className="screen overview" data-screen="overview">
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
              data-testid={`tab-${t.id}`}
              aria-selected={activeTab === t.id ? "true" : "false"}
              onClick={() => dispatch({ type: "navigate_overview", tab: t.id })}
            >
              {t.label}
            </button>
          ))}
        </nav>
        {dataFolder && (
          <div className="sidebar__footer" title={dataFolder}>
            <span data-testid="status-bar-path" className="sidebar__path">{dataFolder}</span>
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
                data-testid="create-space-btn"
                onClick={() => {
                  setParentForNew(null);
                  setShowNewSpace((v) => !v);
                }}
              >
                + New Space
              </button>
            </div>

            {showNewSpace && (
              <form className="card form-card" onSubmit={handleCreateSpace}>
                {parentForNew && (
                  <div className="form-hint" data-testid="create-space-parent">
                    Child of {spaces.find((s) => s.id === parentForNew)?.name ?? parentForNew}
                  </div>
                )}
                <input
                  className="input"
                  placeholder="Space name"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  data-testid="create-space-name"
                  autoFocus
                />
                <input
                  className="input"
                  placeholder="Description (optional)"
                  value={newSpaceDesc}
                  onChange={(e) => setNewSpaceDesc(e.target.value)}
                  data-testid="create-space-description"
                />
                <div className="form-actions">
                  <button className="btn btn--primary" type="submit" data-testid="create-space-submit">
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

            <ul className="card-list" data-testid="spaces-list">
              {orderSpaceTree(spaces).map(({ space: s, depth }) => (
                <li
                  key={s.id}
                  className="card card--clickable"
                  data-testid="space-item"
                  data-name={s.name}
                  data-depth={depth}
                  style={depth > 0 ? { marginLeft: `${depth * 1.5}rem` } : undefined}
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
                  <div className="card__actions">
                    <button
                      className="btn btn--small"
                      data-testid="create-child-space-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setParentForNew(s.id);
                        setNewSpaceName("");
                        setNewSpaceDesc("");
                        setShowNewSpace(true);
                      }}
                    >
                      + Child
                    </button>
                    <button
                      className="btn btn--danger btn--small"
                      data-testid="delete-space-btn"
                      onClick={(e) => { e.stopPropagation(); dispatch({ type: "delete_space", id: s.id }); }}
                    >
                      Delete
                    </button>
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
                  data-testid="label-list-item"
                  data-label={l.label}
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

        {activeTab === "views" && (
          <div className="tab-content">
            <h2>Views</h2>
            <ul className="card-list" data-testid="views-list">
              <li className="empty">No views yet.</li>
            </ul>
          </div>
        )}

        {(activeTab === "recent" || activeTab === "search") && (
          <div className="tab-content">
            <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
            <p className="empty">Coming soon.</p>
          </div>
        )}
      </main>
    </div>
  );
}
