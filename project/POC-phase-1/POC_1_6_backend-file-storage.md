# Task 1.6 — Backend File Storage Integration

> Wire the file storage library into the backend service for per-user data persistence.

| | |
|---|---|
| **Phase** | [Phase 1: Data Model & Storage](../POC-phase-1-status.md) |
| **Requirements** | P1-R10, P1-R13, FR-B1.1–B1.4 |
| **Decisions** | D-003 (backend file-based, per-user), D-012 (single-user) |
| **Depends on** | 1.3, 1.5 |
| **Blocks** | Phase 5 |
| **Status** | Not started |

---

## Goal

Integrate the `storage` crate into the backend Axum service. API handlers use the storage library for data persistence. Storage is organized per-user directory.

## Scope

### Changes

- `backend-service/Cargo.toml` — add `storage` dependency
- `backend-service/src/main.rs` — initialize storage, add to Axum state
- API handlers call storage library functions

### Per-User Storage Layout

```
backend-data/
└── users/
    └── {user-id}/          # For POC: single "default" user
        ├── notes/
        ├── topics/
        ├── index/
        └── config.json
```

For POC with single-user (D-012): use a fixed `default` user directory. The per-user structure prepares for future multi-user support.

### Configuration

- Storage root configurable via environment variable: `STORAGE_ROOT` (default: `./backend-data`)
- User ID: hardcoded `default` for POC

### Integration

```
HTTP Request → Axum Handler → Storage Library → Filesystem
```

1. On startup: `init_storage(STORAGE_ROOT / "users" / "default")`
2. `StorageHandle` stored in Axum application state
3. Each handler receives `StorageHandle` via Axum state extraction
4. Handler calls storage library, returns result as HTTP response

## Tests

- [ ] Backend starts and creates storage directory structure
- [ ] APIs successfully read/write to the file storage
- [ ] Data persists across server restarts
- [ ] Config.json includes format version

## Acceptance Criteria

- [ ] Backend uses storage library for all CRUD operations
- [ ] Storage root configurable via env var
- [ ] Per-user directory structure created
- [ ] Data persists between server restarts
- [ ] `cargo build -p backend-service` succeeds
- [ ] Integration test: create note via API → restart server → read note via API → same data
