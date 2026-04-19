# Phase 4 Status — Linking

> Bidirectional links between notes and topics, backlinks, inline reference sync.

Requirements: [POC-phase-4-requirements.md](POC-phase-4-requirements.md)
Decisions: [POC-decisions.md](POC-decisions.md) — D-009, D-010

---

## Tasks

| # | Task | Depends on | Status | Definition |
|---|------|-----------|--------|------------|
| 4.1 | Link creation UI (note↔note, note↔topic) | Phase 2 (2.2, 2.3) | Done | [4.1_link-creation-ui.md](POC-phase-4/4.1_link-creation-ui.md) |
| 4.2 | Bidirectional link storage and resolution | Phase 1 (1.2) | Done | [4.2_bidirectional-link-storage.md](POC-phase-4/4.2_bidirectional-link-storage.md) |
| 4.3 | Backlinks display | 4.2 | Done | [4.3_backlinks-display.md](POC-phase-4/4.3_backlinks-display.md) |
| 4.4 | Inline references with index sync | 4.1, 2.1 | Done | [4.4_inline-references-sync.md](POC-phase-4/4.4_inline-references-sync.md) |

---

## Phase Status

**Status: Done**

### Dependency Graph

```
Phase 2 (2.2 + 2.3)
 ├──→ 4.1 (link creation UI)
 │     └──→ 4.4 (inline references sync) ←── 2.1
Phase 1 (1.2)
 └──→ 4.2 (bidirectional storage)
       └──→ 4.3 (backlinks display)
```

### Notes

- Task 4.2 (storage logic) can start after Phase 1 without waiting for Phase 2
- Task 4.4 is the critical implementation of D-009 (reference index sync)
- Backlinks (4.3) depends on bidirectional storage being in place (4.2)
