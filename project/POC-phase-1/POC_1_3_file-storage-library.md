# Task 1.3 — File Storage Library

> Implement a shared file-based storage library for reading/writing notes, topics, relations, and assets.

| | |
|---|---|
| **Phase** | [Phase 1: Data Model & Storage](../POC-phase-1-status.md) |
| **Requirements** | P1-R7, P1-R8, P1-R13 |
| **Decisions** | D-002 (local file layout), D-003 (backend same layout), D-009 (reference index) |
| **Depends on** | 1.1 |
| **Blocks** | 1.4, 1.5, 1.6 |
| **Status** | Not started |

---

## Goal

Create a reusable Rust library for file-based storage that both the desktop app and backend service can use. This library encapsulates the file layout defined in D-002.

## Scope

### New Crate

Create `storage/` crate in the workspace:

- `storage/Cargo.toml`
- `storage/src/lib.rs` — public API
- `storage/src/notes.rs` — note CRUD operations
- `storage/src/topics.rs` — topic CRUD operations  
- `storage/src/relations.rs` — relation CRUD (classifications, note refs, topic relations)
- `storage/src/assets.rs` — asset file operations
- `storage/src/index.rs` — index file management (references.json, classifications.json, relations.json)
- `storage/src/config.rs` — storage config (format version)

### Workspace Changes

- `Cargo.toml` (workspace) — add `storage` to members
- `desktop-app/src-tauri/Cargo.toml` — add `storage` dependency (task 1.4)
- `backend-service/Cargo.toml` — add `storage` dependency (task 1.6)

## API Design

```rust
/// Initialize storage at a given root path
pub fn init_storage(root: &Path) -> Result<StorageHandle>;

/// Note operations
pub fn create_note(store: &StorageHandle, note: &Note) -> Result<()>;
pub fn read_note(store: &StorageHandle, id: &Uuid) -> Result<Note>;
pub fn update_note(store: &StorageHandle, note: &Note) -> Result<()>;
pub fn delete_note(store: &StorageHandle, id: &Uuid) -> Result<()>;
pub fn list_notes(store: &StorageHandle) -> Result<Vec<NoteSummary>>;

/// Topic operations
pub fn create_topic(store: &StorageHandle, topic: &Topic) -> Result<()>;
pub fn read_topic(store: &StorageHandle, id: &Uuid) -> Result<Topic>;
pub fn update_topic(store: &StorageHandle, topic: &Topic) -> Result<()>;
pub fn delete_topic(store: &StorageHandle, id: &Uuid) -> Result<()>;
pub fn list_topics(store: &StorageHandle) -> Result<Vec<Topic>>;

/// Classification operations
pub fn classify_note(store: &StorageHandle, note_id: &Uuid, topic_id: &Uuid) -> Result<()>;
pub fn unclassify_note(store: &StorageHandle, note_id: &Uuid, topic_id: &Uuid) -> Result<()>;
pub fn get_note_topics(store: &StorageHandle, note_id: &Uuid) -> Result<Vec<Topic>>;
pub fn get_topic_notes(store: &StorageHandle, topic_id: &Uuid) -> Result<Vec<NoteSummary>>;

/// Reference operations
pub fn add_reference(store: &StorageHandle, ref: &NoteReference) -> Result<()>;
pub fn remove_reference(store: &StorageHandle, source: &Uuid, target: &Uuid) -> Result<()>;
pub fn get_backlinks(store: &StorageHandle, note_id: &Uuid) -> Result<Vec<NoteReference>>;

/// Topic relation operations
pub fn add_topic_relation(store: &StorageHandle, rel: &TopicRelation) -> Result<()>;
pub fn remove_topic_relation(store: &StorageHandle, source: &Uuid, target: &Uuid) -> Result<()>;
pub fn get_topic_relations(store: &StorageHandle, topic_id: &Uuid) -> Result<Vec<TopicRelation>>;

/// Asset operations
pub fn save_asset(store: &StorageHandle, note_id: &Uuid, filename: &str, data: &[u8]) -> Result<Asset>;
pub fn read_asset(store: &StorageHandle, note_id: &Uuid, asset_id: &Uuid) -> Result<Vec<u8>>;
pub fn delete_asset(store: &StorageHandle, note_id: &Uuid, asset_id: &Uuid) -> Result<()>;
```

## File Layout (D-002)

```
{root}/
├── notes/
│   └── {note-id}/
│       ├── content.md
│       ├── meta.json
│       └── assets/
│           └── {filename}
├── topics/
│   └── topics.json
├── index/
│   ├── references.json
│   ├── classifications.json
│   └── relations.json
└── config.json
```

## JSON Schemas

### `meta.json` (per note)

```json
{
  "id": "uuid",
  "title": "string",
  "created_at": "ISO 8601",
  "updated_at": "ISO 8601",
  "source_type": "typed|pasted|uploaded|captured",
  "version": 1,
  "assets": [
    {
      "id": "uuid",
      "filename": "string",
      "mime_type": "string",
      "size_bytes": 0,
      "is_original": true,
      "content_hash": "optional string",
      "created_at": "ISO 8601",
      "source_type": "uploaded|pasted|captured"
    }
  ]
}
```

### `topics.json`

```json
{
  "topics": [
    {
      "id": "uuid",
      "name": "string",
      "description": "optional string",
      "created_at": "ISO 8601",
      "updated_at": "ISO 8601",
      "version": 1
    }
  ]
}
```

### `classifications.json`

```json
{
  "classifications": [
    {
      "note_id": "uuid",
      "topic_id": "uuid",
      "created_at": "ISO 8601"
    }
  ]
}
```

### `references.json`

```json
{
  "references": [
    {
      "source_note_id": "uuid",
      "target_note_id": "uuid",
      "reference_type": "links-to|embeds",
      "created_at": "ISO 8601"
    }
  ]
}
```

### `relations.json`

```json
{
  "relations": [
    {
      "source_topic_id": "uuid",
      "target_topic_id": "uuid",
      "relation_type": "subtopic-of|related-to|classifies",
      "created_at": "ISO 8601"
    }
  ]
}
```

### `config.json`

```json
{
  "format_version": "1.0.0",
  "created_at": "ISO 8601"
}
```

## Tests

- [ ] `init_storage` creates correct directory structure
- [ ] Note CRUD: create → read → update → delete cycle
- [ ] Topic CRUD: create → read → update → delete cycle
- [ ] Classification: classify → get_note_topics → unclassify
- [ ] References: add → get_backlinks → remove
- [ ] Topic relations: add → get → remove
- [ ] Asset: save → read → delete
- [ ] Concurrent reads don't corrupt data (basic file locking or no-conflict assumption)
- [ ] Config version written correctly

## Acceptance Criteria

- [ ] `storage` crate compiles as part of workspace
- [ ] All CRUD operations work on local filesystem
- [ ] File layout matches D-002 specification
- [ ] JSON files are valid and match schemas above
- [ ] All tests pass
- [ ] Crate is usable from both desktop-app and backend-service
