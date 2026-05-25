# UX Spec

Spec IDs in this document use the `S-UX-*` prefix. Editor behaviour is included here as a sub-spec of UX.

## App Frame and Navigation

### Main Frame

- [S-UX-MF1] Navigation, actions, main content area, status bar.
  - Status bar: data folder path, sync status, version.
  - Actions: Settings, New Note, Search.
  - Navigation:
    - breadcrumbs, back/forward, parent, home.
    - switch: spaces, labels, notes views, recent activity, search.
    - context-based navigation.
  - Content area: context-based.
- [S-UX-MF2] Responsive layout, adapts to screen size and orientation.
- [S-UX-MF3] All elements (navigation, actions, content) are always visible and accessible, except where another spec explicitly overrides this (e.g. [S-UX-SA1]).

### Starting the App

- [S-UX-SA1] Select or create data folder on first launch, with option to skip to default. Main frame elements are not visible until a data folder is selected.
- [S-UX-SA2] If no space exists, create default space `My`.
- [S-UX-SA3] If no intention is provided on launch (e.g. opening a specific note or view), default content area is a new note in notes view with default space.

## Spaces Tab

- [S-UX-ST1] Space navigation: tree, search.
- [S-UX-ST2] Space view: name, description, labels, statistics.
- [S-UX-ST3] Space management: create; rename [TBD future]; move [TBD future]; open notes view with space selected.

## Labels Tab

- [S-UX-LT1] Label navigation: list, search.
- [S-UX-LT2] Label view: name, description, statistics.
- [S-UX-LT3] Label management: rename, delete orphans, open notes view with label selected.

## Notes Views Tab

- [S-UX-NVT1] Notes navigation (3 section layout):
  - spaces: search and select spaces to filter notes.
    - search text input, list of spaces with checkboxes; when no text is entered, all selected spaces are displayed.
  - labels: search and select labels to filter notes.
    - search text input, list of labels with checkboxes; when no text is entered, all selected labels are displayed.
  - search: text to search in note content and metadata.
  - tree of notes matching selected filters: title, labels in short, description and metadata in expanded detail. Sort by relevance, `created_at`, `updated_at`.
- [S-UX-NVT2] Note view/edit.
- [S-UX-NVT3] Note management: edit mode; delete [TBD future]; move [TBD future].
- [S-UX-NVT4] [TBD] Search: dedicated "Search" notes view. The `[?<query>]` suffix on references (see [S-DM-NR3](data-model.md#note-references)) parametrizes Notes view, Space view, and in-note navigation. Search relevance, indexing strategy, and query grammar are pending.

## Note Editing (Editor Sub-Spec)

- [S-UX-NE1] Metadata panel above / top-inside content. Synced. Interactive, expandable: all metadata and actions.
  - Draft: indicator and action to publish note.
  - Id: indicators — absence of space/parent, title. Actions — move.
  - Labels: actions — add, remove.
  - Attachments: indicators — count. Actions — add file, capture screen part.
- [S-UX-NE2] Note editor with markdown support and live preview.
  - Inline suggests, autocomplete, and validation.
  - Highlight note description in content.
  - **Editor commands** in content editor: `/:command [<arg>];` triggers an action. Commands are **editor-only sugar**: they are interpreted and **stripped before save**; the stored markdown never contains command syntax. This is the resolution of the apparent tension with [S-DM-N2](data-model.md#notes) ("no custom syntax").
    - `labels` set via `/:labels <tag1> <tag2> <tag3>;` (each tag matches `^[a-z0-9-]+$`).
- [S-UX-NE3] Editor actions: save, undo/redo, delete.
- [S-UX-NE4] Draft autosave:
  - Debounced (triggered after a pause in typing, not on each keystroke). Must not interrupt editing or reposition the cursor.
  - No empty drafts: if content is empty, no draft is saved and any existing draft file is deleted (see [S-DM-N7](data-model.md#notes)).
- [S-UX-NE5] Content fidelity: trailing whitespace, newlines, and spaces are preserved exactly as entered during autosave. No content normalization during editing.
- [S-UX-NE6] Content prettification (whitespace normalization, formatting): only on explicit publish action, and only after user confirmation.

## Error Handling

- [S-UX-ERR] Recoverable failures are surfaced via a dedicated error screen rather than crashing or silently failing.
  - Triggers: storage I/O errors (e.g. inaccessible data folder, permission denied, corrupt file), failed long-running effects, unrecoverable parse errors on user-facing data.
  - Display: human-readable message describing what failed and, where possible, why.
  - Recovery actions: at minimum a "Go home" action returning the app to the overview (or first-launch if no data folder is configured); retry where the failed operation is idempotent.
  - Out of scope here: developer-facing diagnostics, telemetry. Error message wording is not part of the spec.
