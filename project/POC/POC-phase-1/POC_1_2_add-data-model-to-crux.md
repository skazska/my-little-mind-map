# Task 1.2 — Add Data Model to Shared CRUX Core

> Implement the data model as Rust types in the `shared/` crate (CRUX core).

| | |
|---|---|
| **Phase** | [Phase 1: Data Model & Storage](../POC-phase-1-status.md) |
| **Requirements** | P1-R1, P1-R2, P1-R3, P1-R4, P1-R5, P1-R6, P1-R14 |
| **Decisions** | D-001 (model from Mermaid), D-004 (topic graph), D-005 (AST), D-008 (metadata) |
| **Depends on** | 1.1 |
| **Blocks** | 1.4, 1.5, Phase 2, Phase 4 (4.2) |
| **Status** | Not started |

---

## Goal

Translate the data model design (1.1) into Rust types in `shared/src/`. These types are the authoritative implementation used by all platform shells and the backend.

## Scope

### New Files

- `shared/src/model/mod.rs` — module declarations
- `shared/src/model/note.rs` — `Note`, `NoteMetadata` types
- `shared/src/model/topic.rs` — `Topic` type
- `shared/src/model/asset.rs` — `Asset` type
- `shared/src/model/relation.rs` — `Classification`, `NoteReference`, `TopicRelation` types
- `shared/src/model/common.rs` — shared enums (`SourceType`, `ReferenceType`, `TopicRelationType`)

### Changes to Existing Files

- `shared/src/lib.rs` — add `pub mod model;`
- `shared/src/app.rs` — update `Model` to include data model types (notes, topics, relations collections)
- `shared/Cargo.toml` — add `uuid` and `chrono` (or `time`) dependencies
- `shared_types/` — types automatically available via `pub use shared::*`

## Requirements

### All types must

1. Derive `Serialize`, `Deserialize` (serde) — P1-R14
2. Derive `Clone`, `Debug`, `PartialEq`
3. Use `uuid::Uuid` for IDs
4. Use `chrono::DateTime<Utc>` (or `time::OffsetDateTime`) for timestamps
5. Include `version: u64` on mutable entities (Note, Topic) for sync (D-006)

### CRUX Model Update

The `Model` struct in `app.rs` should hold in-memory collections:

```rust
pub struct Model {
    pub notes: Vec<Note>,
    pub topics: Vec<Topic>,
    pub classifications: Vec<Classification>,
    pub note_references: Vec<NoteReference>,
    pub topic_relations: Vec<TopicRelation>,
}
```

### Events (extend `Event` enum)

Add events for data operations (to be used by Phase 2+):

- `CreateNote { title, content, topic_ids }`
- `UpdateNote { id, title, content }`
- `DeleteNote { id }`
- `CreateTopic { name, description }`
- `UpdateTopic { id, name, description }`
- `DeleteTopic { id }`
- `ClassifyNote { note_id, topic_id }`
- `UnclassifyNote { note_id, topic_id }`
- etc.

> Note: Events don't need full implementation yet — just the enum variants. Handlers are added in Phase 2.

### ViewModel Update

Extend `ViewModel` to expose data for the UI:

```rust
pub struct ViewModel {
    pub notes: Vec<NoteView>,
    pub topics: Vec<TopicView>,
    // ... view-specific types
}
```

## Tests

- [ ] All types pass serde round-trip (serialize → deserialize → equals original)
- [ ] `Model::default()` creates empty collections
- [ ] UUID generation works
- [ ] Timestamp creation works

## Acceptance Criteria

- [ ] All entity types from 1.1 design implemented as Rust structs
- [ ] All relation types implemented
- [ ] Types are `Serialize + Deserialize`
- [ ] `shared` crate compiles with new types
- [ ] `shared_types` crate compiles (FFI types generated)
- [ ] `cargo test -p shared` passes
- [ ] `cargo build --workspace` succeeds
