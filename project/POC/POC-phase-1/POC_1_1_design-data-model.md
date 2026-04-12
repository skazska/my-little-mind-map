# Task 1.1 — Design Data Model

> Design the core data model for the mind map application using Mermaid ER diagrams.

| | |
|---|---|
| **Phase** | [Phase 1: Data Model & Storage](../POC-phase-1-status.md) |
| **Requirements** | P1-R1 through P1-R6, P1-R14 |
| **Decisions** | D-001 (Mermaid), D-004 (topic graph), D-005 (structured AST), D-008 (metadata), D-010 (text-centered), D-011 (classification required), D-012 (single-user) |
| **Depends on** | — |
| **Blocks** | 1.2, 1.3 |
| **Status** | Not started |

---

## Goal

Produce a formal data model design that captures all entity types, their attributes, and relationships. This design drives the Rust types (1.2) and storage layout (1.3).

## Deliverables

1. **Mermaid ER diagram** — in [data-model.md](1.1_design-data-model/data-model.md)
2. **Entity descriptions** — prose description of each entity and its purpose
3. **Relationship descriptions** — all relation types with cardinality and semantics

## Entities to Model

### Note (keystone artifact)

> D-010: "Notes are the keystone artifact type"

- `id`: UUID
- `title`: string (derived from first heading or explicit)
- `content_ast`: structured AST (mdast or custom) — the markdown content parsed to AST (D-005)
- `content_raw`: raw markdown string (for round-trip fidelity)
- `created_at`: ISO 8601 timestamp (D-008)
- `updated_at`: ISO 8601 timestamp (D-008)
- `source_type`: enum `typed | pasted | uploaded | captured` (D-008)
- `version`: integer — incremented on each save (for sync, D-006)

### Topic

> D-004: "Graph with typed relations"

- `id`: UUID
- `name`: string
- `description`: optional string
- `created_at`: ISO 8601 timestamp
- `updated_at`: ISO 8601 timestamp
- `version`: integer

### Asset (non-text artifact)

> D-010: "Non-text artifacts cannot exist without a referencing note"

- `id`: UUID
- `filename`: string (original filename)
- `mime_type`: string
- `size_bytes`: integer
- `note_id`: UUID — the note this asset belongs to
- `is_original`: boolean — true if this is where the asset was first added
- `content_hash`: optional string (for future content addressing)
- `created_at`: ISO 8601 timestamp
- `source_type`: enum `uploaded | pasted | captured`

### Relations

#### Note ↔ Topic (Classification)

> D-011: "Every note needs ≥1 topic"

- `note_id`: UUID
- `topic_id`: UUID
- `created_at`: ISO 8601 timestamp

#### Note ↔ Note (Reference)

> D-009: "Reference index sync"

- `source_note_id`: UUID
- `target_note_id`: UUID
- `reference_type`: enum `links-to | embeds`
- `created_at`: ISO 8601 timestamp

#### Topic ↔ Topic (Typed Relation)

> D-004: "subtopic-of, related-to, classifies"

- `source_topic_id`: UUID
- `target_topic_id`: UUID
- `relation_type`: enum `subtopic-of | related-to | classifies`
- `created_at`: ISO 8601 timestamp

### Storage Config

- `format_version`: string (e.g., "1.0.0")
- `created_at`: ISO 8601 timestamp

## Acceptance Criteria

- [ ] Mermaid ER diagram covers all entities and relationships
- [ ] All D-004 topic relation types represented
- [ ] Classification constraint (D-011) is modeled (min cardinality)
- [ ] Text-centered constraint (D-010) is modeled (asset requires note)
- [ ] Metadata fields match D-008
- [ ] Version field present on mutable entities (for sync)
- [ ] Design reviewed and approved before proceeding to 1.2/1.3
