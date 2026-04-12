# Phase 3 Status — Desktop App: Collect (Upload, Paste, Capture)

> Add more ways to collect artifacts: file upload, clipboard paste, screen region capture.

Requirements: [POC-phase-3-requirements.md](POC-phase-3-requirements.md)
Decisions: [POC-decisions.md](POC-decisions.md) — D-002, D-008, D-009, D-010, D-013

---

## Tasks

| # | Task | Depends on | Status | Definition |
|---|------|-----------|--------|------------|
| 3.1 | File upload → artifact | Phase 2 (2.2) | Not started | [3.1_file-upload.md](POC-phase-3/3.1_file-upload.md) |
| 3.2 | Paste from clipboard → artifact | Phase 2 (2.2) | Not started | [3.2_paste-from-clipboard.md](POC-phase-3/3.2_paste-from-clipboard.md) |
| 3.3 | Screen region capture → artifact | Phase 2 (2.2) | Not started | [3.3_screen-region-capture.md](POC-phase-3/3.3_screen-region-capture.md) |
| 3.4 | File/media preview in editor | 3.1 | Not started | [3.4_file-media-preview.md](POC-phase-3/3.4_file-media-preview.md) |

---

## Phase Status

**Status: Not started** — Blocked on Phase 2 (task 2.2: create/save note).

### Dependency Graph

```
Phase 2 (2.2 create/save note)
 ├──→ 3.1 (file upload)
 │     └──→ 3.4 (file/media preview)
 ├──→ 3.2 (clipboard paste)
 └──→ 3.3 (screen capture)
```

### Notes

- Tasks 3.1, 3.2, 3.3 can proceed in parallel after Phase 2
- All collection methods follow same pattern: save asset → insert reference → update index
- Screen capture (3.3) may require additional Tauri plugin evaluation (D-013)
