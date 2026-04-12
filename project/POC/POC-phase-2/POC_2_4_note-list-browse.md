# Task 2.4 — Note List/Browse View

> Implement a note listing and browsing view in the desktop app.

| | |
|---|---|
| **Phase** | [Phase 2: Desktop App — Write & Classify](../POC-phase-2-status.md) |
| **Requirements** | P2-R9, UC-11, NFR-6.2 |
| **Decisions** | — |
| **Depends on** | 2.2 |
| **Blocks** | — |
| **Status** | Not started |

---

## Goal

Build a view that lists all notes with key metadata, allowing the user to browse, search, and open notes.

## Scope

### React Component

- `components/NoteList.tsx` — main note listing component

### Features

| Feature | Description |
|---------|-------------|
| List all notes | Display title, topics, created_at, updated_at |
| Sort | By date (default: most recent first), by title |
| Search | Filter by title text (client-side for POC) |
| Click to open | Navigate to note editor view |
| Note count | Show total number of notes |

### ViewModel

CRUX `ViewModel` provides:

```rust
pub struct NoteListItem {
    pub id: Uuid,
    pub title: String,
    pub topic_names: Vec<String>,
    pub created_at: String,  // formatted for display
    pub updated_at: String,
    pub source_type: String,
}
```

### CRUX Events

- `LoadNotes` — load note list from storage
- `SearchNotes { query }` — filter notes by title
- `SortNotes { by }` — sort by field

### Performance (NFR-6.2)

- Note list should load in < 1s for up to 1000 notes
- For POC: load all note summaries into memory (from meta.json files); pagination can be added later

## Tests

- [ ] Empty state shows "No notes" message
- [ ] Notes appear with title, topics, dates
- [ ] Sort by date works correctly
- [ ] Search filters notes by title
- [ ] Clicking a note opens the editor

## Acceptance Criteria

- [ ] Note list displays all notes with metadata
- [ ] Sort and search work
- [ ] Click navigates to note editor
- [ ] Performance acceptable for ~100 notes (POC scale)
