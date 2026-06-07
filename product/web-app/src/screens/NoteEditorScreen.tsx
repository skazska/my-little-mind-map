import { useState, useRef, useEffect } from "react";
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
  spaceId,
  draft,
  error,
  dispatch,
}: Props) {
  const [localContent, setLocalContent] = useState(content);
  const [localLabels, setLocalLabels] = useState<string[]>(labels);
  const [dirty, setDirty] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset local state when navigating to a different note.
  const [prevId, setPrevId] = useState(id);
  if (prevId !== id) {
    setPrevId(id);
    setLocalContent(content);
    setLocalLabels(labels);
    setDirty(false);
  }

  // Sync localLabels from server after a save completes (e.g. /:labels command
  // processing updates labels through content rather than through the panel).
  useEffect(() => {
    if (!dirty) {
      setLocalLabels(labels);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labels]);

  // Clean up pending auto-save timer on unmount.
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  function handleContentChange(value: string) {
    setLocalContent(value);
    setDirty(true);
    // Auto-save with 1.5 s debounce.
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(value, localLabels), 1500);
  }

  async function save(c: string, l: string[]) {
    setDirty(false);
    await dispatch({ type: "update_note", id, content: c, labels: l });
  }

  async function handleSaveNow() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await save(localContent, localLabels);
  }

  function handleBack() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (dirty) save(localContent, localLabels);
    dispatch({ type: "navigate_back" });
  }

  function handlePublish() {
    setConfirmPublish(true);
  }

  async function confirmPublishAction() {
    setConfirmPublish(false);
    await handleSaveNow();
    dispatch({ type: "publish_note", id });
  }

  function handleDelete() {
    if (confirm("Delete this note?")) {
      dispatch({ type: "delete_note", id });
    }
  }

  // Create a child note under the current one, saving pending edits first so the
  // parent persists before the child is opened. [S-DM-N3]
  function handleAddChild() {
    if (!spaceId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (dirty) save(localContent, localLabels);
    dispatch({ type: "create_note", space_id: spaceId, parent_id: id });
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
          onClick={handleBack}
        >
          ← Back
        </button>
        <h2 className="toolbar__title" data-testid="metadata-title">{title}</h2>
        <div className="toolbar__actions">
          {dirty && <span className="badge badge--unsaved" data-testid="dirty-indicator">Unsaved</span>}
          {draft && <span className="badge badge--draft" data-testid="draft-indicator">Draft</span>}
          <button
            className="btn"
            data-testid="save-note-btn"
            onClick={handleSaveNow}
            disabled={!dirty}
          >
            Save
          </button>
          {draft && (
            <button
              className="btn btn--primary"
              data-testid="publish-note-btn"
              onClick={handlePublish}
            >
              Publish
            </button>
          )}
          {spaceId && (
            <button
              className="btn"
              data-testid="add-child-note-btn"
              onClick={handleAddChild}
            >
              + Subnote
            </button>
          )}
          <button className="btn btn--danger" data-testid="delete-note-btn" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </header>

      {error && <div className="banner banner--error">{error}</div>}

      {/* Publish confirmation dialog [S-UX-NE6] */}
      {confirmPublish && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="publish-confirm-dialog"
          className="dialog-overlay"
        >
          <div className="dialog">
            <p>Publish this note? Formatting will be applied to the content.</p>
            <div className="dialog__actions">
              <button
                className="btn btn--primary"
                data-testid="publish-confirm-ok"
                onClick={confirmPublishAction}
              >
                Publish
              </button>
              <button
                className="btn"
                data-testid="publish-confirm-cancel"
                onClick={() => setConfirmPublish(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
      data-testid="metadata-label-input"
    />
  );
}
