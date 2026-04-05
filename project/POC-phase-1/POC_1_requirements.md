# Phase 1 Requirements — Data Model & Storage

> Phase scope: Define the core data model. Implement file-based storage for desktop (local) and backend.

References: [POC-requirements.md](POC-requirements.md), [POC-decisions.md](POC-decisions.md)

---

## Applicable Requirements

### From POC Requirements

| Requirement | Relevance |
|-------------|-----------|
| NFR-3.1 | Business logic in shared CRUX core — data model types defined here |
| NFR-3.3 | Data model types shared via `shared_types/` |
| D-001 | Data model described with Mermaid diagrams |
| D-002 | File-based local storage layout |
| D-003 | File-based backend storage, per-user |
| D-004 | Topic structure: graph with typed relations |
| D-005 | Markdown content as structured AST |
| D-008 | Auto metadata: `created_at`, `updated_at`, `source_type` |
| D-009 | Reference index sync mechanism |
| D-010 | Text-centered: notes are keystone artifacts |
| D-011 | Classification required: ≥1 topic per note |
| D-012 | Single-user ownership |

### Phase-Specific Requirements

| ID | Requirement | Traces to |
|----|-------------|-----------|
| P1-R1 | Data model includes: Note, Topic, Relation, Asset, Metadata types | NFR-3.1, D-001 |
| P1-R2 | Note type supports structured markdown AST content | D-005 |
| P1-R3 | Topic type supports name, description, metadata | D-004 |
| P1-R4 | Relation types: `note↔note`, `note↔topic` (classification), `topic↔topic` (typed) | D-004, FR-D5.5, FR-D6.1-2 |
| P1-R5 | Typed topic relations: `subtopic-of`, `related-to`, `classifies` | D-004 |
| P1-R6 | Metadata includes `created_at`, `updated_at`, `source_type` on all entities | D-008 |
| P1-R7 | Storage library supports: create, read, update, delete for notes, topics, relations | FR-B3.1-3 |
| P1-R8 | Storage layout matches D-002 (per-note folders, global indexes) | D-002 |
| P1-R9 | Desktop storage reads/writes local filesystem | D-002, NFR-1.1 |
| P1-R10 | Backend storage reads/writes per-user directories | D-003, D-012 |
| P1-R11 | Backend exposes CRUD REST API for notes, topics, relations | FR-B3.1-4 |
| P1-R12 | Backend `/health` endpoint continues to work | FR-B2.4 |
| P1-R13 | Storage format version tracked in `config.json` | D-002 |
| P1-R14 | Data model types serializable with serde (Serialize + Deserialize) | NFR-3.3 |

---

## Acceptance Criteria

- [ ] Data model documented with Mermaid ER diagram
- [ ] Rust types for Note, Topic, Relation, Asset, Metadata compile and pass serde round-trip tests
- [ ] Storage library can CRUD notes, topics, relations on the local filesystem
- [ ] Desktop app can create and read a note via the storage library
- [ ] Backend API exposes CRUD endpoints for notes, topics, relations
- [ ] Backend stores data in per-user file-based layout
- [ ] Existing `/health` endpoint still works
- [ ] Storage format version is tracked
