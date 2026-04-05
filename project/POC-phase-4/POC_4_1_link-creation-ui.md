# Task 4.1 — Link Creation UI

> Implement UI for creating links between notes and between notes and topics.

| | |
|---|---|
| **Phase** | [Phase 4: Linking](../POC-phase-4-status.md) |
| **Requirements** | P4-R1, P4-R2, P4-R8, FR-D6.1, FR-D6.2, FR-D6.6 |
| **Decisions** | D-009 (reference index sync), D-010 (text-centered) |
| **Depends on** | Phase 2 (2.2, 2.3) |
| **Blocks** | 4.4 |
| **Status** | Not started |

---

## Goal

Build the UI for creating links: inline `[[...]]` references in the editor with autocomplete, and note-to-topic links.

## Scope

### Inline Note Linking (note ↔ note)

1. User types `[[` in the markdown editor
2. Autocomplete dropdown appears with note titles (searchable)
3. User selects a note
4. `[[target-note-id|Target Note Title]]` inserted at cursor
5. On save: reference extracted and indexed (D-009)

### Note-to-Topic Linking (note ↔ topic)

Already handled by classification in Phase 2 (task 2.2). This task ensures the UI also allows linking notes to topics from the note context (not just topic assignment).

Additional UI: in the note's metadata/sidebar panel, show classified topics with ability to add/remove.

### Changes

- `desktop-app/src/components/MarkdownEditor.tsx` — `[[` trigger autocomplete
- `desktop-app/src/components/NoteLinkAutocomplete.tsx` — dropdown with note search
- CRUX events: `SearchNotes { query }` returns matching notes for autocomplete

### Autocomplete UX

- Trigger: typing `[[`
- Filter: as user types after `[[`, filter notes by title
- Select: click or Enter inserts the reference
- Cancel: Escape closes autocomplete
- Display: note title + first topic name for disambiguation

## Tests

- [ ] Typing `[[` opens autocomplete
- [ ] Typing after `[[` filters notes
- [ ] Selecting a note inserts correctly formatted reference
- [ ] Escape cancels autocomplete
- [ ] Reference saved to index on note save

## Acceptance Criteria

- [ ] `[[` triggers note autocomplete in editor
- [ ] User can search and select target note
- [ ] Reference correctly formatted and inserted
- [ ] Note-to-topic linking accessible from note sidebar
