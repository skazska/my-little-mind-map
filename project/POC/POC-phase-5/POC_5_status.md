# Phase 5 Status — Sync

> Sync local data with the backend service. Offline-first with manual conflict resolution.

Requirements: [POC-phase-5-requirements.md](POC-phase-5-requirements.md)
Decisions: [POC-decisions.md](POC-decisions.md) — D-003, D-006, D-012

---

## Tasks

| # | Task | Depends on | Status | Definition |
|---|------|-----------|--------|------------|
| 5.1 | Sync protocol design | Phase 1 (1.1) | Not started | [5.1_sync-protocol-design.md](POC-phase-5/5.1_sync-protocol-design.md) |
| 5.2 | CRUX HTTP capability for backend communication | 5.1 | Not started | [5.2_crux-http-capability.md](POC-phase-5/5.2_crux-http-capability.md) |
| 5.3 | Push local changes to backend | 5.2, Phase 1 (1.5) | Not started | [5.3_push-local-changes.md](POC-phase-5/5.3_push-local-changes.md) |
| 5.4 | Pull remote changes to local | 5.2, Phase 1 (1.5) | Not started | [5.4_pull-remote-changes.md](POC-phase-5/5.4_pull-remote-changes.md) |
| 5.5 | Offline-first queue | 5.3, 5.4 | Not started | [5.5_offline-first-queue.md](POC-phase-5/5.5_offline-first-queue.md) |

---

## Phase Status

**Status: Not started** — Blocked on Phase 1 (data model + backend API).

### Dependency Graph

```
Phase 1 (1.1 data model)
 └──→ 5.1 (sync protocol design)
       └──→ 5.2 (CRUX HTTP capability)
             ├──→ 5.3 (push) ←── Phase 1 (1.5 backend API)
             └──→ 5.4 (pull) ←── Phase 1 (1.5 backend API)
                   └──→ 5.5 (offline queue) ←── 5.3
```

### Notes

- 5.1 (sync protocol design) can start as soon as Phase 1 data model is defined
- Sync uses the same file-based storage format on both sides (D-003), simplifying the protocol
- Single-user ownership (D-012) means conflicts are same-user multi-device only
