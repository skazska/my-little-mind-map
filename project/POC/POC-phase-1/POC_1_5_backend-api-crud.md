# Task 1.5 — Backend API: CRUD Endpoints

> Add REST API endpoints for CRUD operations on notes, topics, and relations.

| | |
|---|---|
| **Phase** | [Phase 1: Data Model & Storage](../POC-phase-1-status.md) |
| **Requirements** | P1-R11, P1-R12, FR-B3.1–B3.4 |
| **Decisions** | D-003 (backend file-based storage), D-012 (single-user, no auth) |
| **Depends on** | 1.2, 1.3 |
| **Blocks** | 1.6, Phase 5 |
| **Status** | Not started |

---

## Goal

Extend the Axum backend service with REST API endpoints for creating, reading, updating, and deleting notes, topics, and relations.

## Scope

### New Endpoints

#### Notes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/notes` | Create a new note |
| `GET` | `/api/notes` | List all notes (summary) |
| `GET` | `/api/notes/{id}` | Get a single note |
| `PUT` | `/api/notes/{id}` | Update a note |
| `DELETE` | `/api/notes/{id}` | Delete a note |

#### Topics

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/topics` | Create a new topic |
| `GET` | `/api/topics` | List all topics |
| `GET` | `/api/topics/{id}` | Get a single topic |
| `PUT` | `/api/topics/{id}` | Update a topic |
| `DELETE` | `/api/topics/{id}` | Delete a topic |

#### Classifications

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/classifications` | Classify a note under a topic |
| `DELETE` | `/api/classifications` | Remove a classification |
| `GET` | `/api/notes/{id}/topics` | Get topics for a note |
| `GET` | `/api/topics/{id}/notes` | Get notes under a topic |

#### References

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/references` | Add a note→note reference |
| `DELETE` | `/api/references` | Remove a reference |
| `GET` | `/api/notes/{id}/backlinks` | Get backlinks for a note |

#### Topic Relations

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/topic-relations` | Add a typed topic relation |
| `DELETE` | `/api/topic-relations` | Remove a topic relation |
| `GET` | `/api/topics/{id}/relations` | Get relations for a topic |

#### Assets

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/notes/{id}/assets` | Upload an asset to a note |
| `GET` | `/api/notes/{id}/assets/{asset_id}` | Download an asset |
| `DELETE` | `/api/notes/{id}/assets/{asset_id}` | Delete an asset |

### Existing

- `GET /health` — keep as-is (P1-R12)

### Changes to Existing Files

- `backend-service/src/main.rs` — add new routes, state management
- `backend-service/Cargo.toml` — add `storage`, `shared`, `uuid` dependencies
- New files for handlers: `backend-service/src/handlers/` (notes, topics, relations, assets)

### Request/Response Format

- JSON request/response bodies using the shared data model types
- Standard HTTP status codes: 200 (OK), 201 (Created), 404 (Not Found), 400 (Bad Request), 409 (Conflict), 500 (Internal Error)
- No authentication for POC (D-012, NFR-5.2)

### Validation

- Note creation requires at least one `topic_id` (FR-B3.4, D-011)
- Referenced topic must exist (FR-B3.4)
- Asset upload requires valid note ID

## Tests

- [ ] Each endpoint returns correct status codes
- [ ] CRUD cycle works for notes, topics, relations
- [ ] Validation errors return 400 with message
- [ ] Non-existent resource returns 404
- [ ] `/health` still works

## Acceptance Criteria

- [ ] All CRUD endpoints listed above are implemented
- [ ] Endpoints use shared data model types for serialization
- [ ] Validation enforces classification constraint
- [ ] `/health` endpoint unchanged
- [ ] `cargo build -p backend-service` succeeds
- [ ] Integration tests pass (HTTP requests → correct responses)
