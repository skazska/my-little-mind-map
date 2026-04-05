# Phase 5 Requirements — Sync

> Phase scope: Sync local data with the backend service. Offline-first with manual conflict resolution.

References: [POC-requirements.md](POC-requirements.md), [POC-decisions.md](POC-decisions.md)

---

## Applicable Requirements

### From POC Requirements

| Requirement | Relevance |
|-------------|-----------|
| FR-D7.1–D7.6 | Desktop sync features |
| FR-B1.1–B1.4 | Backend storage |
| FR-B2.1–B2.4 | Backend sync API |
| NFR-1.1–1.3 | Local-first |
| NFR-5.1–5.3 | Single-user ownership |
| D-003 | Backend file-based storage, per-user |
| D-006 | Single-user ownership, manual conflict resolution |
| D-012 | Single-user data ownership model |

### Phase-Specific Requirements

| ID | Requirement | Traces to |
|----|-------------|-----------|
| P5-R1 | Sync protocol: version-based change detection per entity | D-006 |
| P5-R2 | Push: send changed entities (notes, topics, relations) to backend | FR-D7.1, FR-B2.1 |
| P5-R3 | Pull: receive changed entities from backend since last sync | FR-D7.2, FR-B2.2 |
| P5-R4 | Conflict detection: backend rejects push if version mismatch | FR-D7.4, D-006, FR-B2.3 |
| P5-R5 | Conflict UI: show both versions, user picks or merges | FR-D7.4, D-006 |
| P5-R6 | Sync status indicator in desktop UI | FR-D7.5 |
| P5-R7 | Offline queue: changes queued when offline, auto-sync on reconnect | FR-D7.6, NFR-1.1 |
| P5-R8 | No data loss on network failure during sync | NFR-1.3 |
| P5-R9 | CRUX HTTP capability for backend communication | NFR-3.1 |
| P5-R10 | Assets (files) synced alongside note metadata | FR-B1.1 |
| P5-R11 | Backend sync endpoints: `POST /sync/push`, `POST /sync/pull` | FR-B2.1-2 |
| P5-R12 | No authentication required for POC | NFR-5.2 |

---

## Acceptance Criteria

- [ ] User can push local changes to backend and see them stored
- [ ] User can pull backend changes to local
- [ ] Conflicting edits produce a conflict prompt, not silent overwrite
- [ ] User can resolve conflicts by choosing local or remote version
- [ ] App works fully offline — no errors, no blocked features
- [ ] Queued offline changes sync automatically when connectivity returns
- [ ] Sync status indicator shows current state (synced/pending/conflict)
- [ ] Assets are synced alongside notes
