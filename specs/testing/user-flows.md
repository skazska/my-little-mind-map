# Test Cases: User Flows

End-to-end tests that drive the full application through the UI. Each test starts the app via Tauri WebDriver.

**Layer**: E2E (`product/desktop-app/tests/e2e/`, WebdriverIO + `tauri-driver`)
**Spec coverage**: [S-DM-L2], [S-DM-L4], [S-DM-N2], [S-DM-N7], [S-DM-S4], [S-DM-V1], [S-UX-SA1], [S-UX-SA2], [S-UX-SA3], [S-UX-MF1], [S-UX-ST1], [S-UX-ST2], [S-UX-ST3], [S-UX-LT1], [S-UX-LT2], [S-UX-NVT1], [S-UX-NVT2], [S-UX-NVT3], [S-UX-NE1], [S-UX-NE2], [S-UX-NE3], [S-UX-NE4], [S-UX-NE5], [S-UX-NE6], [S-UX-ERR], [S-UX-FB4], [S-UX-FB5], [S-UX-FB6], [S-UX-IN1], [S-UX-INT1], [S-UX-INT2], [S-CFG-1], [S-CFG-2]
**Implementation**: `product/e2e-shared/scenarios/` (shared), `product/desktop-app/tests/e2e/specs/` (desktop), `product/web-app/tests/e2e/specs/` (web)
**Implementation status**: All test cases implemented unless marked `[skipped]`.

**Conventions**:

- Each test heading lists the spec IDs it covers in `[S-...]` brackets.
- A `> Covers ... only.` note below a test scopes its coverage when the underlying spec is partially `[TBD]` (e.g. delete tests pending [S-DM-MV3]).
- Each test starts with a fresh temporary data folder (no persisted config).
- `[selector]` placeholders should be replaced with actual element selectors or `data-testid` attributes when implementing.
- Steps are sequential unless noted.
- **Expected result** is what the test assertion checks.

---

## First Launch

### TC-E2E-FL-01 — First launch shows folder selection screen [S-UX-SA1]

**Given** the app is launched with no persisted data folder config  
**When** the app window finishes loading  
**Then** the `first_launch` screen is visible  
**And** there is a button to select a data folder  
**And** there is a button to use the default data folder [S-CFG-2]

### TC-E2E-FL-02 — Selecting a data folder transitions to overview [S-UX-SA1]

**Given** the first launch screen is visible  
**When** the user clicks "Select folder" and chooses a valid directory via the system dialog  
**Then** the app transitions to the `overview` screen  
**And** the status bar shows the selected folder path [S-UX-MF1]

### TC-E2E-FL-03 — Using default data folder transitions to overview [S-CFG-2]

**Given** the first launch screen is visible  
**When** the user clicks "Use default folder"  
**Then** the app transitions to the `overview` screen  
**And** the default data folder (`~/MyLittleMindMapData`) is created on disk

### TC-E2E-FL-06 — Default space "My" is created when no space exists [S-UX-SA2]

**Given** the app is launched with a fresh data folder containing no spaces  
**When** the app finishes initialising  
**Then** a space named `"My"` appears in the Spaces list  
**And** the `spaces/My/` directory exists on disk

### TC-E2E-FL-07 — App opens new note when no prior context [S-UX-SA3]

**Given** the app is launched with a configured data folder and no remembered navigation intent  
**When** the app finishes loading  
**Then** the `notes_view` screen is shown scoped to the default space  
**And** a new (draft) note editor is active

### TC-E2E-FL-04 — Selected folder persisted across app restarts [S-CFG-1]

**Given** a data folder was selected in a previous session  
**When** the app is restarted  
**Then** the `first_launch` screen is NOT shown  
**And** the app goes directly to `overview` with the previously selected folder

### TC-E2E-FL-05 — Status bar shows correct data folder path [S-UX-MF1]

**Given** the app is open with a data folder configured  
**When** the overview screen is visible  
**Then** the status bar displays the full path to the data folder

---

## Overview

### TC-E2E-OV-01 — Overview shows navigation options for Spaces, Labels, Notes views, Recent, and Search [S-UX-MF1]

**Given** the app is in the overview screen  
**When** no further action is taken  
**Then** navigation options for Spaces, Labels, Notes views, Recent activity, and Search are visible

### TC-E2E-OV-02 — Spaces tab is active by default [S-UX-MF1] [S-UX-ST1]

**Given** the app just transitioned to overview  
**When** no tab is clicked  
**Then** the Spaces tab is selected and a spaces list is shown

### TC-E2E-OV-03 — Create space action is visible [S-UX-ST3]

**Given** the overview screen is visible  
**When** the Spaces tab is active  
**Then** a "Create space" button or form is visible

### TC-E2E-OV-04 — Space search filters the spaces tree [S-UX-ST1]

**Given** the Spaces tab is active with spaces `"work"`, `"personal"`, `"work-archive"` in the tree  
**When** the user types `"work"` in the spaces search input  
**Then** only `"work"` and `"work-archive"` remain visible in the tree  
**And** clearing the search input restores the full tree

---

## Space Management

### TC-E2E-SP-01 — Create space with name only [S-UX-ST3]

**Given** the overview Spaces tab is visible  
**When** the user fills the space name field with `"my-space"` and submits  
**Then** `"my-space"` appears in the spaces list  
**And** the space directory exists on disk

### TC-E2E-SP-02 — Create space with name and description [S-UX-ST3]

**Given** the overview Spaces tab is visible  
**When** the user fills name `"work"` and description `"Work notes"` and submits  
**Then** `"work"` appears in the list with the description visible

### TC-E2E-SP-03 — Navigate into a space opens note list [S-UX-NVT1]

**Given** a space `"my-space"` exists  
**When** the user clicks on `"my-space"` in the spaces list  
**Then** the `note_list` screen is shown for `"my-space"`

### TC-E2E-SP-04 — Delete space removes it from list [S-UX-ST3]

> Covers basic file-remove only. Cascade and reference-cleanup semantics are pending [S-DM-MV3].

**Given** a space `"temp-space"` exists  
**When** the user deletes `"temp-space"` (via delete button/action)  
**Then** `"temp-space"` is no longer in the spaces list  
**And** its directory is removed from disk

### TC-E2E-SP-05 — Space view shows statistics [S-UX-ST2], [S-DM-S4]

**Given** a space `"work"` with 4 notes and 3 distinct labels in use  
**When** the user opens the space view for `"work"`  
**Then** the view displays the space name, description, the list of labels in use, and statistics showing `note_count` and `label_count` (or equivalently named indicators)

---

## Note List

### TC-E2E-NL-01 — Note list shows created notes [S-UX-NVT1]

**Given** space `"space1"` with notes `"note-a"` and `"note-b"` created  
**When** the user navigates into `"space1"`  
**Then** both notes appear in the list with their titles

### TC-E2E-NL-02 — Note shows title, description, labels, and date [S-UX-NVT1]

**Given** a note with title, a description paragraph, labels, and timestamps  
**When** the note list is displayed  
**Then** the list item shows the title, description excerpt, label badges, and the date

### TC-E2E-NL-03 — Draft badge visible for draft notes [S-UX-NVT1], [S-DM-N7]

**Given** a note with `draft: true`  
**When** the note list is displayed  
**Then** a draft badge is visible on that note's list item

### TC-E2E-NL-04 — Search filters notes by title [S-UX-NVT1]

**Given** a note list with notes `"rust-intro"` and `"python-basics"`  
**When** the user types `"rust"` in the search input  
**Then** only `"rust-intro"` is visible in the list

### TC-E2E-NL-05 — Clearing search restores full list [S-UX-NVT1]

**Given** a search query is active  
**When** the user clears the search input  
**Then** all notes are shown again

### TC-E2E-NL-06 — Active view filter badge shown [S-UX-NVT1], [S-DM-V1]

**Given** a view (label filter) is active  
**When** the note list screen is visible  
**Then** the active label(s) are shown as a filter badge above the list

### TC-E2E-NL-07 — Clear view button removes filter [S-UX-NVT1], [S-DM-V1]

**Given** an active label filter is applied  
**When** the user clicks the clear filter button  
**Then** the filter badge disappears and all notes in the space are listed

### TC-E2E-NL-08 — Back button returns to overview [S-UX-MF1]

**Given** the note list screen is visible  
**When** the user clicks the Back button  
**Then** the `overview` screen is shown

---

## Note Editor — Navigation and Display

### TC-E2E-NE-01 — Clicking note opens editor [S-UX-NVT2]

**Given** a note in the note list  
**When** the user clicks on the note  
**Then** the `note_editor` screen is shown with the note's content in the editor

### TC-E2E-NE-02 — Metadata panel shows title, labels, UUID, dates [S-UX-NE1]

**Given** the note editor is open  
**When** the metadata panel is visible (or expanded)  
**Then** the note's title, label list, UUID, created_at, and updated_at are displayed

### TC-E2E-NE-03 — Back button returns to note list [S-UX-MF1]

**Given** the note editor is open  
**When** the user clicks Back  
**Then** the note list screen is shown

---

## Note Editor — Editing

### TC-E2E-NE-04 — Typing content marks note as dirty [S-UX-NE3]

**Given** the note editor is open  
**When** the user types in the content area  
**Then** a dirty indicator (unsaved changes badge) becomes visible

### TC-E2E-NE-05 — Manual save clears dirty indicator [S-UX-NE3]

**Given** the editor has unsaved changes  
**When** the user clicks the Save button  
**Then** the dirty indicator disappears  
**And** the note content is persisted to disk

### TC-E2E-NE-06 — Autosave triggers after typing pause [S-UX-NE4]

**Given** the note editor is open  
**When** the user types content and stops typing for longer than the debounce period (10 s)  
**Then** the content is automatically saved to disk without the user pressing Save  
**And** the cursor position is not moved and the editor is not disrupted [S-UX-NE5]

### TC-E2E-NE-06b — Continuous typing debounces autosave [S-UX-NE4] `[skipped]`

> **Status**: skipped — stub exists in `e2e-shared/scenarios/note-editor.ts` (`it.skip`); requires timing harness to reliably test debounce under CI constraints.

### TC-E2E-NE-06c — Autosave failure surfaces error and allows retry [S-UX-NE4], [S-UX-ERR] `[skipped]`

> **Status**: skipped — stub exists in `e2e-shared/scenarios/note-editor.ts` (`it.skip`); requires ability to make the data folder unwritable mid-test, which is environment-dependent.

**Given** the note editor is open and the data folder becomes unwritable mid-session  
**When** the autosave debounce period elapses and the save attempt fails  
**Then** an error indicator is shown to the user with a descriptive message  
**And** the unsaved content remains in the editor (no data loss)  
**And** a retry action is available; once storage is writable again, retry succeeds and the dirty indicator clears

### TC-E2E-NE-07 — Autosave does not normalize content [S-UX-NE5]

**Given** note content with deliberate trailing spaces and multiple consecutive blank lines  
**When** autosave fires  
**Then** the saved content on disk preserves the trailing spaces and blank lines exactly

### TC-E2E-NE-08 — Add label via metadata panel [S-UX-NE1]

**Given** the note editor is open  
**When** the user types a label `"new-label"` in the label input and confirms  
**Then** `"new-label"` appears in the label list in the metadata panel  
**And** after save, the note file on disk contains `new-label` in the front matter

### TC-E2E-NE-09 — Remove label via metadata panel [S-UX-NE1]

**Given** a note with label `"old-label"` in the metadata panel  
**When** the user removes `"old-label"` via the remove action  
**Then** `"old-label"` disappears from the label list  
**And** after save, the front matter no longer contains `old-label`

### TC-E2E-NE-10 — Content command `/:labels` sets labels [S-UX-NE2]

**Given** the note editor is open  
**When** the user types `/:labels rust learning;` in the content and saves  
**Then** the note's labels include `"rust"` and `"learning"` (visible in metadata panel)

### TC-E2E-NE-11 — Delete note removes it from list [S-UX-NE3]

> Covers basic file-remove only. Cascade and reference-cleanup semantics are pending [S-DM-MV3].

**Given** the note editor is open for note `"space1/my-note"`  
**When** the user clicks Delete and confirms  
**Then** the note list screen is shown  
**And** `"my-note"` is no longer in the list

---

## Note Editor — Draft and Publish

### TC-E2E-NE-12 — New note created as draft [S-UX-NE1]

**Given** the user creates a new note  
**When** the note editor opens  
**Then** a draft indicator is visible in the metadata panel  
**And** `metadata.draft == true` in the saved file

### TC-E2E-NE-13 — Publish clears draft flag [S-UX-NE1]

**Given** a draft note is open in the editor  
**When** the user clicks the Publish button  
**Then** the draft indicator disappears  
**And** the saved file has `draft: false` in the front matter

### TC-E2E-NE-14 — Publish action prettifies content only after confirmation [S-UX-NE6]

**Given** a draft note with inconsistent whitespace  
**When** the user clicks Publish  
**Then** a confirmation dialog appears before any formatting is applied  
**And** only after confirmation is the content normalized

### TC-E2E-NE-15 — Autosave does not create draft when content is empty [S-UX-NE4]

**Given** a brand new note editor is open with no content  
**When** the autosave debounce period elapses  
**Then** no draft file is written to disk  
**And** the note's `draft` flag is not set

### TC-E2E-NE-16 — Clearing all content removes an existing draft [S-UX-NE4]

**Given** a note with an existing draft on disk  
**When** the user clears all content in the editor and the autosave debounce fires  
**Then** the draft file is deleted from disk  
**And** the note's `draft` flag becomes `false`

### TC-E2E-NE-17 — Editor command syntax is not persisted to disk [S-UX-NE2], [S-DM-N2]

**Given** the note editor is open  
**When** the user types `"# Title\n\n/:labels rust;\n\nBody."` and triggers Publish (or Save)  
**Then** the resulting `.md` file on disk contains `"# Title\n\nBody."` in its content section with no `/:labels` substring  
**And** reloading the note in the editor shows content without the command line, while the label `"rust"` is present in the metadata panel

---

## Labels and Views

### TC-E2E-LV-01 — Labels tab shows all labels in use [S-UX-LT1]

**Given** notes with labels `["rust", "learning", "project"]` in the data folder  
**When** the user navigates to the Labels tab in overview  
**Then** `"rust"`, `"learning"`, and `"project"` appear in the labels list

### TC-E2E-LV-02 — Clicking a label filters notes across spaces [S-DM-L2]

**Given** notes in different spaces both labeled `"rust"`  
**When** the user clicks the `"rust"` label in the Labels tab  
**Then** both notes appear in the filtered view regardless of which space they are in

### TC-E2E-LV-03 — Views tab shows saved views [S-UX-NVT1]

**Given** views exist in `labels/views.json`  
**When** the user navigates to the Views tab  
**Then** the saved views are listed

### TC-E2E-LV-04 — Label search filters the labels list [S-UX-LT1]

**Given** the Labels tab is active with labels `["rust", "python", "rust-advanced"]` in use  
**When** the user types `"rust"` in the labels search input  
**Then** only `"rust"` and `"rust-advanced"` remain visible in the list  
**And** clearing the search input restores the full list

### TC-E2E-LT-01 — Label view shows name, description, and statistics [S-UX-LT2], [S-DM-L4]

**Given** the label `"rust"` is in use on 3 notes across 2 spaces  
**When** the user opens the label view for `"rust"`  
**Then** the view displays the label name, any description, and statistics showing `note_count == 3` and `space_count == 2` (or equivalently named indicators)

---

## UX Feedback and Input

> Editor state and filter indicators are also exercised by the Note Editor tests ([S-UX-FB2] via TC-E2E-NE-04/05/12/13) and the Note List tests ([S-UX-FB3] via TC-E2E-NL-06/07). Keyboard editor commands are covered by [S-UX-IN2] tests TC-E2E-NE-10/17.

### TC-E2E-FB-01 — Save button is disabled until there are unsaved changes [S-UX-FB4]

**Given** a note editor is open with no pending changes  
**When** the editor first renders  
**Then** the Save button is disabled  
**And** after the user types in the content area, the Save button becomes enabled

### TC-E2E-FB-02 — Empty lists show guidance instead of a blank area [S-UX-FB5]

> Covers the empty-list cases that are implemented (notes, labels, saved views). The "No notes" call-to-action and the "no spaces" case are pending and tracked under [S-UX-FB5].

**Given** a fresh data folder whose default space `My` has no notes, no labels in use, and no saved views  
**When** the user opens the Notes list, the Labels tab, and the Views tab in turn  
**Then** the Notes list shows a "No notes yet" message rather than an empty pane  
**And** the Labels tab shows a "No labels yet" message  
**And** the Views tab shows a "No saved views yet" message

### TC-E2E-FB-03 — Non-fatal events surface a transient, dismissible notice [S-UX-FB6] `[skipped]`

> **Status**: skipped — no notice/toast component exists in the shells yet; this encodes the newly-authored [S-UX-FB6] spec and is the shared dependency of TC-E2E-INT-02.

**Given** the app triggers a non-fatal event that warrants user notice (e.g. an unresolvable launch intention, see [S-UX-INT2])  
**When** the event occurs  
**Then** a non-blocking notice is shown that does not interrupt the current task  
**And** the notice is dismissible and also auto-dismisses after a short interval  
**And** the dedicated error screen ([S-UX-ERR]) is not shown for this non-fatal event

### TC-E2E-IN-01 — Enter in the add-label input adds the label [S-UX-IN1], [S-UX-NE1]

**Given** the note editor is open  
**When** the user types `"keyboard"` in the add-label input and presses Enter  
**Then** `"keyboard"` appears in the label list in the metadata panel without using a pointer

### TC-E2E-IN-02 — Enter submits the create-space form [S-UX-IN1], [S-UX-ST3]

**Given** the overview Spaces tab is visible with the new-space form open  
**When** the user types a space name and presses Enter in the name field  
**Then** the space is created and appears in the spaces list

### TC-E2E-IN-03 — Baseline keyboard shortcuts drive primary actions [S-UX-IN1] `[skipped]`

> **Status**: skipped — only the in-input Enter/Esc handling exists today; the global shortcut map (Save, New note, Back, Focus search) in [S-UX-IN1] is not yet implemented in the shells.

**Given** the app is on a screen where the corresponding actions exist (note editor with unsaved changes; a list with a search input)  
**When** the user presses `Ctrl/Cmd+S` in the editor, `Ctrl/Cmd+N` to create a note, `Esc` to leave the editor, and `Ctrl/Cmd+F` in a searchable list  
**Then** `Ctrl/Cmd+S` flushes the draft (Unsaved indicator clears)  
**And** `Ctrl/Cmd+N` opens a new draft note  
**And** `Esc` (with no inline input focused) navigates back from the editor  
**And** `Ctrl/Cmd+F` moves focus to the list's search input

---

## Intention-Driven Launch

### TC-E2E-INT-01 — Launch with a note intention opens that note [S-UX-INT1] `[skipped]`

> **Status**: skipped — launch-intention plumbing is not yet implemented in the shells; this test is a placeholder for when [S-UX-INT1] lands.

**Given** the app is launched with an intention to open a specific existing note  
**When** the app finishes loading  
**Then** the `note_editor` screen is shown for that note rather than the default new-note landing ([S-UX-SA3])

### TC-E2E-INT-02 — Unresolvable intention falls back to default landing [S-UX-INT2] `[skipped]`

> **Status**: skipped — depends on [S-UX-INT1] plumbing (see TC-E2E-INT-01).

**Given** the app is launched with an intention whose target does not exist  
**When** the app finishes loading  
**Then** the app lands on the default new note in the default space's notes view ([S-UX-SA3])  
**And** a non-blocking notice is shown ([S-UX-FB1], [S-UX-FB6])

---

## Error Handling

### TC-E2E-ERR-01 — Inaccessible data folder shows error screen [S-UX-ERR]

**Given** the app is configured with a data folder that becomes inaccessible (permissions removed)  
**When** an operation that accesses storage is triggered  
**Then** the `error` screen is shown with a descriptive message

### TC-E2E-ERR-02 — "Go home" button from error screen returns to overview [S-UX-ERR]

**Given** the error screen is displayed  
**When** the user clicks the "Go home" button  
**Then** the app transitions back to the `overview` screen
