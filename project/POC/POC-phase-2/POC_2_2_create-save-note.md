# Task 2.2 — Create/Save Note via CRUX → Local Storage

> Implement the full flow for creating and saving notes through the CRUX core to local file storage.

| | |
|---|---|
| **Phase** | [Phase 2: Desktop App — Write & Classify](../POC-phase-2-status.md) |
| **Requirements** | P2-R4, P2-R5, P2-R6, FR-D1.1, FR-D1.3, FR-D1.6, FR-D1.7 |
| **Decisions** | D-005 (AST storage), D-008 (metadata), D-009 (reference index sync), D-011 (classification required) |
| **Depends on** | 2.1, Phase 1 (1.2, 1.3, 1.4) |
| **Blocks** | 2.4, Phase 3, Phase 4 |
| **Status** | Done |

---

## Goal

Implement the end-to-end flow: user creates/edits a note in the editor → CRUX core processes the event → storage library persists to local filesystem.

## Scope

### Create Note Flow

```
1. User clicks "New Note"
2. React: renders empty MarkdownEditor + topic selector
3. User types content, selects ≥1 topic
4. User clicks "Save"
5. React: invoke Tauri command `create_note` with { content_ast, content_raw, title, topic_ids }
6. Tauri shell: sends CreateNote event to CRUX core
7. CRUX update(): validates (≥1 topic), creates Note with metadata, emits Store effect
8. Tauri shell: handles Store effect → calls storage library
9. Storage library: writes content.md, meta.json, updates classifications.json
10. CRUX: emits Render effect with updated ViewModel
11. React: UI updates to show saved note
```

### Edit Note Flow

```
1. User opens existing note
2. React: invoke `get_note` → renders MarkdownEditor with content
3. User edits content
4. User clicks "Save"
5. React: invoke `update_note` with { id, content_ast, content_raw, title }
6. CRUX update(): validates, updates timestamps, emits Store effect
7. Storage library: updates content.md, meta.json, re-parses references, updates references.json
8. React: UI updates
```

### Changes

#### Rust (CRUX Core — `shared/src/app.rs`)

- Implement `CreateNote` event handler
- Implement `UpdateNote` event handler
- Add `Store` effect variant to `Effect` enum
- Validation: reject save if `topic_ids` is empty (D-011)
- Auto-populate `created_at`, `updated_at`, `source_type: typed` (D-008)
- Increment `version` on update

#### Rust (Tauri shell — `desktop-app/src-tauri/src/lib.rs`)

- Handle `Store` effect: dispatch to storage library
- New Tauri commands: `create_note`, `update_note`, `get_note`, `delete_note`

#### TypeScript (React — `desktop-app/src/`)

- `components/NoteEditor.tsx` — wraps MarkdownEditor + topic selector + save button
- `components/TopicSelector.tsx` — multi-select for topic assignment
- Tauri invoke calls for CRUD operations

### Reference Index Sync (D-009, P2-R5)

On every save:

1. Parse AST for internal references (`[[note-id|text]]`)
2. Compare with current references in `references.json`
3. Add new references, remove stale ones
4. This ensures text content and index are always in sync

## Tests

- [x] Create note with valid topic → saved to filesystem
- [x] Create note without topic → rejected with error
- [x] Edit note → `updated_at` changes, `version` increments
- [x] References in content are extracted and indexed
- [x] Stale references removed from index on edit
- [x] Note metadata correctly populated (source_type, timestamps)

## Acceptance Criteria

- [x] User can create a new note with mandatory topic classification
- [x] Note is persisted to local filesystem in correct layout
- [x] User can edit and re-save a note
- [x] Metadata populated correctly (D-008)
- [x] Classification constraint enforced (D-011)
- [x] Reference index updated on save (D-009)
- [x] Desktop app compiles and runs with create/save flow
