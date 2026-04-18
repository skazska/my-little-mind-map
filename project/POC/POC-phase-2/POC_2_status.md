# Phase 2 Status — Desktop App: Write & Classify

> Build the core writing and classification experience in the desktop app.

Requirements: [POC-phase-2-requirements.md](POC-phase-2-requirements.md)
Decisions: [POC-decisions.md](POC-decisions.md) — D-004, D-005, D-009, D-010, D-011

---

## Tasks

| # | Task | Depends on | Status | Definition |
|---|------|-----------|--------|------------|
| 2.1 | Markdown editor with AST support | Phase 1 | Done | [POC_2_1_markdown-editor-ast.md](POC_2_1_markdown-editor-ast.md) |
| 2.2 | Create/save note via CRUX → local storage | 2.1, Phase 1 | Done | [POC_2_2_create-save-note.md](POC_2_2_create-save-note.md) |
| 2.3 | Topic management (CRUD + relations) | Phase 1 | In progress | [POC_2_3_topic-management.md](POC_2_3_topic-management.md) |
| 2.4 | Note list/browse view | 2.2 | In progress | [POC_2_4_note-list-browse.md](POC_2_4_note-list-browse.md) |
| 2.5 | Topic filter/browse view | 2.3 | Not started | [POC_2_5_topic-filter-browse.md](POC_2_5_topic-filter-browse.md) |

---

## Phase Status

**Status: In progress** — Tasks 2.1 and 2.2 complete. Tasks 2.3 and 2.4 are actively being implemented on a feature branch. Task 2.5 has not started.

### Dependency Graph

```
Phase 1 (complete)
 ├──→ 2.1 (markdown editor + AST spike)
 │     └──→ 2.2 (create/save note) ←── Phase 1
 │           └──→ 2.4 (note list)
 ├──→ 2.3 (topic management)
 │     └──→ 2.5 (topic filter)
```

### Notes

- Task 2.1 includes a spike to evaluate mdast cross-platform compatibility (D-005)
- Tasks 2.1 and 2.3 can proceed in parallel after Phase 1
- Classification enforcement (D-011) implemented in task 2.2 save flow
- Current implementation branch includes the first Topic Management and Note List slices: topic update/delete/relation commands, relation-aware ViewModel data, and desktop UI components for topic management and searchable/sortable note listing
