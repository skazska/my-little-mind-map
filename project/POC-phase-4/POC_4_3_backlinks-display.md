# Task 4.3 — Backlinks Display

> Show backlinks (incoming references) for the current note.

| | |
|---|---|
| **Phase** | [Phase 4: Linking](../POC-phase-4-status.md) |
| **Requirements** | P4-R5, P4-R6, FR-D6.5, UC-8 |
| **Decisions** | D-009, D-010 |
| **Depends on** | 4.2 |
| **Blocks** | — |
| **Status** | Not started |

---

## Goal

Display a backlinks panel in the note view showing all notes that reference the current note, with surrounding context.

## Scope

### Backlinks Panel

- Located below the note editor or in a sidebar tab
- Lists all notes that reference the current note
- Each backlink shows:
  - Source note title
  - surrounding context text (the paragraph containing the `[[reference]]`)
  - Click to navigate to source note

### Context Extraction

From the source note's AST:

1. Find the node containing `[[current-note-id|...]]`
2. Extract the parent paragraph/block node
3. Render as plain text (truncated to ~200 chars)

### Changes

- `desktop-app/src/components/BacklinksPanel.tsx` — backlinks display component
- CRUX ViewModel: add backlinks to note view
- CRUX event: `LoadBacklinks { note_id }` → queries storage → populates ViewModel

### ViewModel

```rust
pub struct BacklinkItem {
    pub source_note_id: Uuid,
    pub source_note_title: String,
    pub context_text: String,  // surrounding text from source note
    pub is_broken: bool,
}
```

## Tests

- [ ] Note with no backlinks: panel shows "No backlinks"
- [ ] Note with backlinks: each displayed with title and context
- [ ] Click on backlink navigates to source note
- [ ] Broken backlinks shown with visual indicator
- [ ] Context extraction works correctly

## Acceptance Criteria

- [ ] Backlinks panel visible on note view
- [ ] Backlinks show source note title + context
- [ ] Click navigates to source
- [ ] Broken backlinks indicated
