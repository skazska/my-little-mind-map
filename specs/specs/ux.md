# UX Spec

Spec IDs in this document use the `S-UX-*` prefix. Editor behaviour is included here as a sub-spec of UX.

Satisfies:

- @E-EDIT — note authoring and navigation (`S-UX-MF*`, `S-UX-SA*`, `S-UX-ST*`, `S-UX-LT*`, `S-UX-NVT*`, `S-UX-NE*`).
- @E-UX and its sub-codes (see [UX expectations](../expectations/ux-expectations.md)): @E-UX-FEEDBACK (`S-UX-FB*`), @E-UX-CONSISTENCY (`S-UX-CON*`), @E-UX-NAV (`S-UX-NAV*`), @E-UX-INPUT (`S-UX-IN*`), @E-UX-THEME (`S-UX-TH*`).
- @E-INTENTIONS — intention-driven launch (`S-UX-INT*`).
- @E-RESPONSIVE — responsive behaviour (`S-UX-MF2`).
- @E-MINIMAL-ACTIONS — minimal user actions (`S-UX-MIN*`).
- @E-ERRORS — graceful error handling (`S-UX-ERR`).

> Screen wireframes and user flows illustrating these specs are maintained in [UX expectations](../expectations/ux-expectations.md). They are illustrative, not authoritative; this spec governs behaviour.

## App Frame and Navigation

### Main Frame

#### S-UX-MF1

Navigation, actions, main content area, status bar.

- Status bar: data folder path, sync status, version.
- Actions: Settings, New Note, Search.
- Navigation:
  - breadcrumbs, back/forward, parent, home.
  - switch: spaces, labels, notes views, recent activity, search.
  - context-based navigation.
- Content area: context-based.

#### S-UX-MF2

Responsive layout, adapts to screen size and orientation. Satisfies @E-RESPONSIVE.

- **Breakpoints**: a single breakpoint divides **narrow** (viewport width `< 640px`) from **regular** (`>= 640px`). Shells MAY add finer breakpoints but MUST honour this boundary.
- **Regular**: persistent two-pane frame — left navigation sidebar + main content (as in the wireframes).
- **Narrow**: the sidebar collapses behind a menu toggle and overlays the content when opened; the main content uses the full width; the note editor's metadata panel stacks above the content instead of beside it. ViewModel-field omission follows @S-UX-NE1.

#### S-UX-MF3

All elements (navigation, actions, content) are always visible and accessible, except where another spec explicitly overrides this (e.g. @S-UX-SA1) or where a responsive breakpoint collapses them behind an explicit affordance (@S-UX-MF2, narrow viewports).

### Starting the App

#### S-UX-SA1

Select or create data folder on first launch, with option to skip to default. Main frame elements are not visible until a data folder is selected.

- **Platform note — Web**: On first launch, the web shell prompts the user to select a data folder via `showDirectoryPicker()` with no option to skip.

#### S-UX-SA2

If no space exists, create default space `My`.

#### S-UX-SA3

If no intention is provided on launch (e.g. opening a specific note or view), default content area is a new note in notes view with default space. Intention handling is specified in @S-UX-INT1.

## Spaces Tab

### S-UX-ST1

Space navigation: tree, search.

### S-UX-ST2

Space view: name, description, labels, statistics.

### S-UX-ST3

Space management: create; delete; rename `TBD post-POC`; move `TBD post-POC`; open notes view with space selected.

## Labels Tab

### S-UX-LT1

Label navigation: list, search.

### S-UX-LT2

Label view: name, description, statistics.

### S-UX-LT3

Label management: rename, delete orphans, open notes view with label selected.

## Notes Views Tab

### S-UX-NVT1

Notes navigation (3 section layout):

- spaces: search and select spaces to filter notes.
  - search text input, list of spaces with checkboxes; when no text is entered, all selected spaces are displayed.
- labels: search and select labels to filter notes.
  - search text input, list of labels with checkboxes; when no text is entered, all selected labels are displayed.
- search: text to search in note content and metadata.
- tree of notes matching selected filters: title, labels in short, description and metadata in expanded detail. Sort by relevance, `created_at`, `updated_at`.

### S-UX-NVT2

Note view/edit.

### S-UX-NVT3

Note management: edit mode; delete; move `TBD post-POC`.

### S-UX-NVT4

`TBD post-POC` Search: dedicated "Search" notes view. The `[?<query>]` suffix on references (see @S-DM-NR3) parametrizes Notes view, Space view, and in-note navigation. Search relevance, indexing strategy, and query grammar are pending.

## Note Editing (Editor Sub-Spec)

### S-UX-NE1

Metadata panel above / top-inside content. Synced. Interactive, expandable: all metadata and actions.

- Draft: indicator and action to publish note.
- Id: indicators — absence of space/parent, title. Actions — move `TBD post-POC` (see @S-DM-MV1).
- Labels: actions — add, remove.
- Attachments: `TBD post-POC` (lifecycle deferred, see @S-DM-MV4) indicators — count. Actions — add file, capture screen part.
- **Platform note — ViewModel fields**: Shells MAY omit display of `uuid`, `created_at`, and `updated_at` from the metadata panel when screen space is constrained (e.g. narrow viewports). These fields MUST still be present in the ViewModel and MUST be displayable in the expanded metadata view.

### S-UX-NE2

Note editor with markdown support and live preview.

- Inline suggests, autocomplete, and validation.
- Highlight note description in content.
- **Editor commands** in content editor: `/:command [<arg>];` triggers an action. Commands are **editor-only sugar**: they are interpreted and **stripped before save**; the stored markdown never contains command syntax. This is the resolution of the apparent tension with @S-DM-N2 ("no custom syntax").
  - `labels` set via `/:labels <tag1> <tag2> <tag3>;` (each tag matches `^[a-z0-9-]+$`).

### S-UX-NE3

Editor actions: save, undo/redo, delete.

- **Undo/redo scope**: undo/redo operates on the in-editor content of the current note (text edits), not on cross-note or structural actions (create/delete note, label changes applied via the metadata panel). History is per-note and is not required to persist across navigating away from the note.

### S-UX-NE4

Draft autosave:

- Debounced (triggered after a pause in typing, not on each keystroke). Must not interrupt editing or reposition the cursor.
- Debounce window: 1–10 seconds. Platform shells may choose a value within this range based on I/O cost; the chosen value MUST be documented in the shell's implementation notes. Default recommendation: 2 s for low-latency storage (web/browser), up to 10 s for filesystem-backed storage.
- **Save-state feedback**: while changes are pending the editor shows the "Unsaved" indicator (@S-UX-FB2); when a debounced save is in flight it MAY show a transient "Saving…" state; on success the indicator clears ("Saved"). Feedback MUST NOT steal focus or move the cursor. On failure, surface via @S-UX-ERR.
- No empty drafts: if content is empty, no draft is saved and any existing draft file is deleted (see @S-DM-N7).

### S-UX-NE5

Content fidelity: trailing whitespace, newlines, and spaces are preserved exactly as entered during autosave. No content normalization during editing.

### S-UX-NE6

Content prettification (whitespace normalization, formatting): only on explicit publish action, and only after user confirmation.

- **What "formatting will be applied" means**: on publish the stored markdown is normalised — trailing whitespace trimmed, surrounding blank lines collapsed to a single blank line, and a single trailing newline enforced. Publish does not rewrite the user's wording, headings, or link targets. The confirmation dialog (@S-UX-FB, wireframe in [UX expectations](../expectations/ux-expectations.md)) warns that this normalisation will occur.

## Error Handling

### S-UX-ERR

Recoverable failures are surfaced via a dedicated error screen rather than crashing or silently failing.

- Triggers: storage I/O errors (e.g. inaccessible data folder, permission denied, corrupt file), failed long-running effects, unrecoverable parse errors on user-facing data.
- Display: human-readable message describing what failed and, where possible, why.
- Recovery actions: at minimum a "Go home" action returning the app to the overview (or first-launch if no data folder is configured); retry where the failed operation is idempotent.
- Out of scope here: developer-facing diagnostics, telemetry. Error message wording is not part of the spec.

## Intention-Driven Launch

Satisfies @E-INTENTIONS.

### S-UX-INT1

The app MAY be launched with an intention that directs the initial screen and context: open a specific note (`note://`, see @S-DM-NR1), open a view or space, or create a new note in a given space. When an intention is present it overrides the default landing behaviour of @S-UX-SA3.

### S-UX-INT2

When no intention is provided, the app falls back to @S-UX-SA3 (a new note in the default space's notes view). An unrecognised or unresolvable intention (e.g. a missing target) falls back to the same default and surfaces a non-blocking notice (@(S-UX-FB1,S-UX-FB6)).

## Feedback and Affordances

Satisfies @E-UX-FEEDBACK.

### S-UX-FB1

Action feedback: every user-initiated action that mutates state or triggers an effect produces visible feedback (state change, indicator, banner, or notice). Failures are surfaced (see @S-UX-ERR) rather than swallowed.

### S-UX-FB2

Editor state indicators: the note editor shows an "Unsaved" indicator while there are pending changes and a "Draft" indicator while the note is a draft; both clear when no longer applicable (see @(S-UX-NE3,S-UX-NE4)).

### S-UX-FB3

Filtering and context indicators: active filters (e.g. label/view filter on the notes list) are shown as a removable badge; the active navigation context (tab, space) is visually distinguished.

### S-UX-FB4

Interactive affordances: actionable elements are visually distinguishable from static content and expose their disabled state (e.g. Save disabled when there are no unsaved changes).

### S-UX-FB5

Empty states: when a list or content area has no items, it shows a short explanatory message and, where an action can resolve it, a primary call-to-action rather than a blank area. Minimum cases:

- No notes in the selected space/view: "No notes yet" + "New note" action.
- No labels in use: "No labels yet" + hint that labels are added in the editor (`/:labels …;`).
- No spaces (default space absent): offer to create a space; the default space `My` is normally created by @S-UX-SA2.
- No saved views: "No saved views yet".

### S-UX-FB6

Non-blocking notice: a notice (used by @S-UX-INT2 and other non-fatal events) is a transient, non-blocking message (toast or inline banner) that does not interrupt the current task, is dismissible, and auto-dismisses after a short interval. It is distinct from the dedicated error screen (@S-UX-ERR), which is reserved for recoverable failures that block the current context.

## Navigation and Information Architecture

Satisfies @E-UX-NAV. Refines the app-frame navigation of @S-UX-MF1.

### S-UX-NAV1

Persistent frame: primary navigation (spaces, labels, notes views, recent, search) and the status bar remain available across screens, except where @(S-UX-MF3,S-UX-SA1) explicitly hide them.

### S-UX-NAV2

Locatability: the user can always return to the overview ("home") and, within content, move via back/forward and breadcrumbs (see @S-UX-MF1).

### S-UX-NAV3

Context-based content: the main content area reflects the active navigation context; switching context away from the editor saves pending changes first (@S-UX-NE3) so navigation never silently discards edits.

## Input and Interaction

Satisfies @E-UX-INPUT. Refines @E-MINIMAL-ACTIONS (see @S-UX-MIN1).

### S-UX-IN1

Keyboard-first: primary actions are reachable from the keyboard. In short text inputs with a confirm/cancel pair (e.g. add-label input, create-space form), Enter confirms and Esc cancels.

- **Baseline shortcut map** (shells MAY map platform-idiomatic modifiers — `Ctrl` on desktop/web, `Cmd` on macOS):
  - Save / flush draft: `Ctrl/Cmd+S` (in editor).
  - New note: `Ctrl/Cmd+N`.
  - Back / leave editor: `Esc` (when no inline input is focused).
  - Confirm dialog primary action: `Enter`; cancel: `Esc`.
  - Focus search: `Ctrl/Cmd+F` within a list that has a search input.
- Shortcuts beyond this baseline are optional; the baseline MUST be honoured where the corresponding action exists on the screen.

### S-UX-IN2

In-content editor commands: the editor supports `/:command …;` sugar for label actions without leaving the keyboard (see @S-UX-NE2).

### S-UX-IN3

Pointer and touch: all keyboard-accessible actions are also operable via pointer/touch; touch targets remain usable on small viewports (see @S-UX-MF2).

## Minimal User Actions

Satisfies @E-MINIMAL-ACTIONS. Cross-cutting principle applied across the UX specs.

### S-UX-MIN1

Sensible defaults: flows provide intuitive defaults that reduce required input — default space `My` (@S-UX-SA2), a new note opened ready to edit (@S-UX-SA3), and autosave (@S-UX-NE4).

### S-UX-MIN2

Few action types: prefer a small, consistent set of interaction patterns over many specialised ones; reuse the same controls (cards, search inputs, badges) across tabs and screens.

## Cross-Platform Consistency

Satisfies @E-UX-CONSISTENCY. Refines @E-CROSS-PLATFORM at the UX surface.

### S-UX-CON1

Consistent structure: desktop, web, and mobile shells present the same screens (first launch, overview, notes list, note editor, error), navigation model, and terminology.

### S-UX-CON2

Specified deviations only: platform differences are limited to documented exceptions — e.g. the web shell's first launch (no folder picker, @S-UX-SA1) and ViewModel-field omission on narrow viewports (@S-UX-NE1). Such deviations MUST be specified, not incidental.

### S-UX-CON3

Behavioural parity: shared core logic (@S-ARCH-1) drives equivalent behaviour across shells; shell-specific values (e.g. the autosave debounce within @S-UX-NE4's 1–10 s range) stay within spec-defined bounds.

## Theming and Appearance

Satisfies @E-UX-THEME.

### S-UX-TH1

`TBD post-POC` Light and dark appearances: a consistent visual theme offered in light and dark variants, applied uniformly across screens. The POC ships a single dark theme.

### S-UX-TH2

`TBD post-POC` System appearance: where the platform exposes a system light/dark preference, the app follows it by default, with an explicit override.
