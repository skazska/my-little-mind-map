# Task 1.4 — Desktop Local Storage Integration

> Integrate the file storage library into the Tauri desktop app for local data persistence.

| | |
|---|---|
| **Phase** | [Phase 1: Data Model & Storage](../POC-phase-1-status.md) |
| **Requirements** | P1-R9, NFR-1.1, NFR-1.2 |
| **Decisions** | D-002 (local file layout) |
| **Depends on** | 1.2, 1.3 |
| **Blocks** | Phase 2 |
| **Status** | Not started |

---

## Goal

Wire the `storage` crate into the Tauri desktop app so that CRUX core operations persist to the local filesystem.

## Scope

### Changes

- `desktop-app/src-tauri/Cargo.toml` — add `storage` dependency
- `desktop-app/src-tauri/src/lib.rs` — initialize storage on app startup, pass `StorageHandle` to CRUX core
- Storage root: `{app_data_dir}/data/` (Tauri's app data directory)

### Integration Pattern

```
React UI → Tauri Command → CRUX Core → Storage Library → Local Filesystem
```

1. Tauri app startup: call `init_storage(app_data_dir / "data")`
2. Store `StorageHandle` in Tauri managed state alongside CRUX `Core`
3. CRUX effects that need storage → shell (Tauri) handles the effect → calls storage library
4. Alternative: pass storage handle directly to CRUX update handlers via a capability

### Decisions Needed During Implementation

- How to expose storage to CRUX: via a custom CRUX capability/effect, or handle storage in the Tauri shell?
- For POC: handling in the Tauri shell is simpler (CRUX emits a "Store" effect, Tauri processes it)

## Tests

- [ ] App starts and creates storage directory structure
- [ ] Storage path uses Tauri's app data directory
- [ ] StorageHandle is accessible from Tauri commands

## Acceptance Criteria

- [ ] Desktop app initializes file storage on startup
- [ ] Storage directory created at correct location
- [ ] CRUX core can trigger storage operations via effects
- [ ] `cargo build -p desktop-app` succeeds
- [ ] Manual test: app starts without errors
