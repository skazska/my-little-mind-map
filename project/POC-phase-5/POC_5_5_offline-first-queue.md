# Task 5.5 — Offline-First Queue

> Implement offline change queuing and automatic sync on reconnect.

| | |
|---|---|
| **Phase** | [Phase 5: Sync](../POC-phase-5-status.md) |
| **Requirements** | P5-R5, P5-R6, P5-R7, P5-R8, FR-D7.3, FR-D7.5, FR-D7.6, NFR-1.1–1.3 |
| **Decisions** | D-006 (single-user, queue offline) |
| **Depends on** | 5.3, 5.4 |
| **Blocks** | — |
| **Status** | Not started |

---

## Goal

Ensure the app works fully offline. Queue changes locally and sync automatically when connectivity returns.

## Scope

### Offline Detection

- Monitor network connectivity state
- Tauri: use `navigator.onLine` in webview, or custom Tauri plugin for deeper detection
- Periodically attempt backend health check (`GET /health`)

### Change Queue

Already partially implemented via `sync_state.json` with `pending_push` status. This task makes it robust:

1. All local operations succeed immediately (local-first)
2. Changes marked as `pending_push` in sync state
3. Sync button shows pending count
4. When offline: sync operations fail gracefully, changes remain queued
5. When online detected: trigger automatic sync

### Sync Status UI (P5-R6)

React component showing:

- **Synced**: green indicator — all changes pushed, no pending
- **Pending**: yellow indicator — N changes waiting to push
- **Syncing**: spinner — sync in progress
- **Conflict**: red indicator — N conflicts to resolve
- **Offline**: gray indicator — no connectivity

### Automatic Sync

- On connectivity restored: trigger `SyncPush` then `SyncPull`
- Optional: periodic sync timer (configurable interval, default 5 minutes)
- Timer configured in Phase 6 (task 6.3 app settings)

### Conflict Resolution UI (P5-R5)

When conflicts exist:

1. Show conflict indicator with count
2. User opens conflict resolution view
3. For each conflict: show local version and server version side-by-side
4. User chooses: "Keep mine", "Keep theirs", or edits to merge

### Changes

- `desktop-app/src/components/SyncStatusIndicator.tsx` — sync status badge
- `desktop-app/src/components/ConflictResolver.tsx` — conflict resolution UI
- `shared/src/app.rs` — sync state management events
- `desktop-app/src-tauri/src/lib.rs` — connectivity monitoring
- CRUX events: `ConnectivityChanged { online }`, `ResolveConflict { entity_id, resolution }`

## Tests

- [ ] Offline: create note → save succeeds locally → shows pending
- [ ] Offline: sync button shows offline indicator
- [ ] Reconnect: pending changes automatically pushed
- [ ] Conflict: shows both versions, user can resolve
- [ ] All features work without network (NFR-1.1)
- [ ] No data loss on network failure (P5-R8)

## Acceptance Criteria

- [ ] App works fully offline (all CRUD operations succeed locally)
- [ ] Changes queued when offline
- [ ] Automatic sync on reconnect
- [ ] Sync status indicator shows current state
- [ ] Conflict resolution UI allows user to resolve conflicts
- [ ] No data loss in any scenario
