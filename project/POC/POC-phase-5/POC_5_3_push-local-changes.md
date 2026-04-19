# Task 5.3 — Push Local Changes to Backend

> Implement pushing local changes to the backend service.

| | |
|---|---|
| **Phase** | [Phase 5: Sync](../POC-phase-5-status.md) |
| **Requirements** | P5-R2, P5-R4, P5-R8, P5-R10, FR-D7.1 |
| **Decisions** | D-006 (manual conflict resolution) |
| **Depends on** | 5.2, Phase 1 (1.5) |
| **Blocks** | 5.5 |
| **Status** | Cancelled |

---

## Goal

Implement the push side of sync: detect local changes and send them to the backend.

## Scope

### Push Flow

1. User triggers sync (manual button or background timer)
2. CRUX: emit `SyncPush` event
3. CRUX: read local `sync_state.json` to find entities with `pending_push` status
4. CRUX: emit `Http` effect with push request (per protocol from 5.1)
5. Tauri: makes HTTP POST to `/api/sync/push`
6. Backend: validates versions, accepts or rejects changes
7. Response received by CRUX:
   - Accepted: update `sync_state.json` with new server versions, set status to `synced`
   - Rejected (conflict): set status to `conflict`, store server version

### Change Detection

On every local save:

1. Increment entity `version`
2. Update `sync_state.json`: set entity status to `pending_push`

### Asset Push

For notes with new/changed assets:

1. Include asset metadata in push payload
2. Upload asset binary via separate endpoint (`POST /api/sync/assets/push`)
3. Use `content_hash` to skip already-uploaded assets

### Backend Endpoints (implement alongside)

- `POST /api/sync/push` — accept entity changes
- `POST /api/sync/assets/push` — accept asset uploads

### Changes

- `shared/src/app.rs` — `SyncPush` event handler, `SyncPushResponse` event
- `storage/src/` — `sync_state.json` management
- `backend-service/src/handlers/` — sync push handler
- `desktop-app/src-tauri/src/lib.rs` — HTTP effect handling for sync

## Tests

- [ ] Local change → push → accepted by backend → synced status
- [ ] Local change → push → conflict → conflict status set
- [ ] Asset upload works alongside metadata push
- [ ] Network failure → no data loss, still pending
- [ ] Multiple entities pushed in single request

## Acceptance Criteria

- [ ] Local changes detected and pushed to backend
- [ ] Backend accepts or rejects with conflict
- [ ] Sync state tracked correctly
- [ ] Assets synced
- [ ] No data loss on failure (P5-R8)
