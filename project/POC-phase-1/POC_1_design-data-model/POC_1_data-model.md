# Data Model — Mermaid ER Diagram

> Task artifact for [1.1_design-data-model.md](../1.1_design-data-model.md)

## Entity Relationship Diagram

```mermaid
erDiagram
    Note {
        uuid id PK
        string title
        json content_ast
        string content_raw
        datetime created_at
        datetime updated_at
        enum source_type "typed|pasted|uploaded|captured"
        int version
    }

    Topic {
        uuid id PK
        string name
        string description
        datetime created_at
        datetime updated_at
        int version
    }

    Asset {
        uuid id PK
        string filename
        string mime_type
        int size_bytes
        uuid note_id FK
        bool is_original
        string content_hash
        datetime created_at
        enum source_type "uploaded|pasted|captured"
    }

    Classification {
        uuid note_id FK
        uuid topic_id FK
        datetime created_at
    }

    NoteReference {
        uuid source_note_id FK
        uuid target_note_id FK
        enum reference_type "links-to|embeds"
        bool broken
        datetime created_at
    }

    TopicRelation {
        uuid source_topic_id FK
        uuid target_topic_id FK
        enum relation_type "subtopic-of|related-to|classifies"
        datetime created_at
    }

    Note ||--o{ Asset : "contains"
    Note ||--o{ Classification : "classified by"
    Topic ||--o{ Classification : "classifies"
    Note ||--o{ NoteReference : "source"
    Note ||--o{ NoteReference : "target"
    Topic ||--o{ TopicRelation : "source"
    Topic ||--o{ TopicRelation : "target"
```

## Constraints

```mermaid
graph TD
    A["Note must have ≥1 Classification<br/>(D-011)"]
    B["Asset must belong to a Note<br/>(D-010)"]
    C["TopicRelation source ≠ target"]
    D["NoteReference source ≠ target"]
    E["Topic name unique"]
    F["Classification (note_id, topic_id) unique"]
    G["NoteReference (source, target) unique"]
    H["TopicRelation (source, target) unique"]
```

## Enums

```mermaid
classDiagram
    class SourceType {
        <<enumeration>>
        Typed
        Pasted
        Uploaded
        Captured
    }

    class ReferenceType {
        <<enumeration>>
        LinksTo
        Embeds
    }

    class TopicRelationType {
        <<enumeration>>
        SubtopicOf
        RelatedTo
        Classifies
    }
```

## Storage File Mapping

| Entity | Storage location | Format |
|--------|-----------------|--------|
| Note (content) | `notes/{id}/content.md` | Markdown (raw) |
| Note (AST) | embedded in `meta.json` or separate `content.ast.json` | JSON (AST) |
| Note (metadata) | `notes/{id}/meta.json` | JSON |
| Asset (file) | `notes/{id}/assets/{filename}` | Binary |
| Asset (metadata) | inside `notes/{id}/meta.json` | JSON |
| Topic | `topics/topics.json` | JSON |
| Classification | `index/classifications.json` | JSON |
| NoteReference | `index/references.json` | JSON |
| TopicRelation | `index/relations.json` | JSON |
| Config | `config.json` | JSON |

## Notes

- **Status:** Finalized
- **Version field:** On Note and Topic for sync conflict detection (D-006)
- **content_hash:** On Asset for future content addressing (D-002)
- **broken:** On NoteReference for detecting stale links (D-009, NFR-4.3)
- **content_ast:** Stored as opaque JSON (`serde_json::Value`) in Phase 1; real mdast evaluation deferred to Phase 2 task 2.1
