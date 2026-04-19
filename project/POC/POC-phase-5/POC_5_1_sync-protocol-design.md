# Task 5.1 — Sync Protocol Design

> Design the sync protocol for exchanging data between desktop app and backend.

| | |
|---|---|
| **Phase** | [Phase 5: Sync](../POC-phase-5-status.md) |
| **Requirements** | P5-R1, P5-R4, P5-R8, P5-R11 |
| **Decisions** | D-003 (same file layout both sides), D-006 (single-user, manual conflict resolution), D-012 (single-user) |
| **Depends on** | Phase 1 (1.1) |
| **Blocks** | 5.2 |
| **Status** | Cancelled |

---

## Goal

Design the sync protocol: what data is exchanged, how changes are detected, how conflicts are resolved, and what the API contract looks like.

## Scope

### Sync Model

**Version-based change detection:**

- Each entity (note, topic) has a `version` field (integer, incremented on save)
- Client tracks `last_synced_version` per entity
- On push: client sends entities with version > last_synced_version
- On pull: server returns entities with version > client's known version

**Entity change tracking:**

- `sync_state.json` on client: `{ entity_id: { local_version, server_version, sync_status } }`
- Sync statuses: `synced`, `pending_push`, `pending_pull`, `conflict`

### API Contract

#### Push: `POST /api/sync/push`

Request:

```json
{
  "changes": [
    {
      "entity_type": "note|topic|classification|reference|topic_relation",
      "operation": "create|update|delete",
      "entity": { ... },
      "expected_server_version": 0
    }
  ]
}
```

Response (success):

```json
{
  "accepted": [{ "entity_id": "uuid", "new_version": 2 }],
  "rejected": [{ "entity_id": "uuid", "reason": "conflict", "server_entity": { ... } }]
}
```

#### Pull: `POST /api/sync/pull`

Request:

```json
{
  "since": {
    "note-id-1": 3,
    "note-id-2": 1
  }
}
```

Response:

```json
{
  "changes": [
    { "entity_type": "note", "operation": "update", "entity": { ... } }
  ]
}
```

### Conflict Resolution (D-006)

1. Client pushes change with `expected_server_version`
2. Server checks: if current server version == expected → accept, increment version
3. If current server version > expected → reject with conflict + server entity
4. Client receives conflict → shows both versions to user
5. User chooses: keep local, keep remote, or manual merge
6. Client re-pushes with resolved entity and correct expected version

### Asset Sync

Binary assets synced separately:

- `POST /api/sync/assets/push` — upload asset files
- `GET /api/sync/assets/pull/{note_id}/{asset_id}` — download asset file
- Assets identified by `content_hash` to avoid re-uploading identical files

### Deliverable

- Protocol design document in this task folder: `project/POC-phase-5/5.1_sync-protocol-design/protocol.md`

## Tests

N/A — design task. Tests in implementation tasks (5.3, 5.4, 5.5).

## Acceptance Criteria

- [ ] Protocol document covers: push, pull, conflict detection, conflict resolution, asset sync
- [ ] API contract specified (request/response schemas)
- [ ] Edge cases documented (offline, partial sync, large payloads)
- [ ] Protocol reviewed before implementation starts
