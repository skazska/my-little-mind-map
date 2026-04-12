# Task 5.4 — Pull Remote Changes to Local

> Implement pulling remote changes from the backend to the local storage.

| | |
|---|---|
| **Phase** | [Phase 5: Sync](../POC-phase-5-status.md) |
| **Requirements** | P5-R3, P5-R10, FR-D7.2 |
| **Decisions** | D-006 (manual conflict resolution) |
| **Depends on** | 5.2, Phase 1 (1.5) |
| **Blocks** | 5.5 |
| **Status** | Not started |

---

## Goal

Implement the pull side of sync: fetch changes from the backend and apply them to local storage.

## Scope

### Pull Flow

1. User triggers sync (typically paired with push)
2. CRUX: emit `SyncPull` event
3. CRUX: read `sync_state.json` to build "since" map (known server versions per entity)
4. CRUX: emit `Http` effect with pull request
5. Tauri: makes HTTP POST to `/api/sync/pull`
6. Backend: returns entities changed since requested versions
7. Response received by CRUX:
   - No local changes to those entities: apply directly to local storage
   - Local changes exist: conflict — store both versions, set status to `conflict`

### Applying Changes

For each received entity:

1. Check if local has unsaved changes (pending_push)
2. If no conflict: write entity to local storage via storage library
3. If conflict: store server version in `sync_state.json` conflict data
4. Update `sync_state.json` server versions

### Asset Pull

For notes with changed/new assets on server:

1. Note metadata includes asset list
2. Compare with local assets
3. Download missing assets via `GET /api/sync/assets/pull/{note_id}/{asset_id}`
4. Save to local `notes/{note-id}/assets/`

### Backend Endpoints

- `POST /api/sync/pull` — return changed entities since given versions
- `GET /api/sync/assets/pull/{note_id}/{asset_id}` — download asset

### Changes

- `shared/src/app.rs` — `SyncPull` event handler, `SyncPullResponse` event
- `backend-service/src/handlers/` — sync pull handler
- `storage/src/` — apply remote changes

## Tests

- [ ] Pull new note from backend → appears in local storage
- [ ] Pull updated note → local version updated
- [ ] Pull with local conflict → conflict detected, both versions stored
- [ ] Asset pull works
- [ ] Empty pull (no changes) handled correctly

## Acceptance Criteria

- [ ] Remote changes pulled and applied to local storage
- [ ] Conflicts detected when local and remote both changed
- [ ] Assets downloaded alongside metadata
- [ ] Sync state updated correctly
