# Test Cases: App Logic

Unit and integration tests for the shared core — event dispatch, state transitions, `update()` + `view()` functions, and cross-cutting logic.

**Layer**: Unit / Integration (`shared/`, `cargo test`)
**Spec coverage**: [S-DM-N4], [S-DM-N5], [S-DM-L1], [S-DM-L4], [S-UX-NE1], [S-UX-NE2], [S-UX-NE4], [S-UX-NE5], [S-UX-NE6], [S-CFG-1], [S-CFG-2], [S-CFG-3]

---

## App Lifecycle — Startup

### TC-AL-LIFE-01 — AppStarted with data_folder emits LoadSettings + LoadSpaces

**Given** a clean model  
**When** `update(AppStarted { data_folder: Some("/path") }, &mut model)` is called  
**Then** the returned effects include `Effect::Storage(StorageRequest::LoadSettings)` and `Effect::Storage(StorageRequest::LoadSpaces)`  
**And** model transitions away from the loading state

### TC-AL-LIFE-02 — AppStarted without data_folder emits Render only

**Given** a clean model  
**When** `update(AppStarted { data_folder: None }, &mut model)` is called  
**Then** the returned effects contain only `Effect::Render`  
**And** `view(model).screen` indicates `first_launch`

### TC-AL-LIFE-03 — DataFolderSelected sets folder and triggers settings + spaces load

**Given** a model in `first_launch` state  
**When** `update(DataFolderSelected { path: "/chosen/path" }, &mut model)` is called  
**Then** effects include `StorageRequest::LoadSettings` and `StorageRequest::LoadSpaces`

### TC-AL-LIFE-04 — SettingsLoaded stores settings in model

**Given** settings with `data_folder`, `theme`  
**When** `update(SettingsLoaded { settings }, &mut model)` is called  
**Then** the model stores the settings (accessible in subsequent `view()` calls)

---

## Navigation

### TC-AL-NAV-01 — NavigateToNote emits LoadNote effect

**Given** a model in the overview state  
**When** `update(NavigateToNote { id: "space1/note1" }, &mut model)` is called  
**Then** effects include `StorageRequest::LoadNote { id: "space1/note1" }`

### TC-AL-NAV-02 — NavigateToSpace emits LoadNotes effect

**Given** a model in the overview state  
**When** `update(NavigateToSpace { id: "space1" }, &mut model)` is called  
**Then** effects include `StorageRequest::LoadNotes { space_id: "space1" }`

### TC-AL-NAV-03 — NavigateBack returns to previous screen

**Given** a model that navigated from overview → note list  
**When** `update(NavigateBack, &mut model)` is called  
**Then** `view(model).screen` is `overview` (or note list if deeper)

### TC-AL-NAV-04 — NavigateOverview sets active tab

**Given** any state  
**When** `update(NavigateOverview { tab: "labels" }, &mut model)` is called  
**Then** `view(model)` indicates the labels tab is active in the overview

---

## Space Management

### TC-AL-SP-01 — CreateSpace emits StorageRequest::CreateSpace

**Given** a model in overview state  
**When** `update(CreateSpace { name: "my-space", description: None }, &mut model)` is called  
**Then** effects include `StorageRequest::CreateSpace { space }` where `space.id.as_str() == "my-space"`

### TC-AL-SP-02 — SpaceCreated triggers LoadSpaces

**Given** any state  
**When** `update(SpaceCreated { id: "my-space" }, &mut model)` is called  
**Then** effects include `StorageRequest::LoadSpaces`

### TC-AL-SP-03 — DeleteSpace emits StorageRequest::DeleteSpace

**Given** a model with spaces loaded  
**When** `update(DeleteSpace { id: "my-space" }, &mut model)` is called  
**Then** effects include `StorageRequest::DeleteSpace { id: "my-space" }`

---

## Note Management

### TC-AL-N-01 — CreateNote emits StorageRequest::CreateNote

**Given** a model in a space view  
**When** `update(CreateNote { space_id: "space1", parent_id: None }, &mut model)` is called  
**Then** effects include `StorageRequest::CreateNote` with a note in `"space1"` with `draft: true`

### TC-AL-N-02 — UpdateNote syncs title from first heading [S-DM-N5]

**Given** a model with note `"space1/note1"` loaded  
**When** `update(UpdateNote { id: "space1/note1", content: "# My Title\n\nBody", labels: [] }, &mut model)` is called  
**Then** the `SaveNote` storage request contains a note with `metadata.title == "my-title"` (normalized)

### TC-AL-N-03 — UpdateNote without heading leaves title unchanged [S-DM-N5]

**Given** a note with existing title `"old-title"`  
**When** `update(UpdateNote { ..., content: "No heading here", ... }, &mut model)` is called  
**Then** `metadata.title` remains `"old-title"`

### TC-AL-N-04 — UpdateNote applies labels from panel [S-DM-N5]

**Given** a model with note loaded  
**When** `update(UpdateNote { ..., labels: ["rust", "learning"], ... }, &mut model)` is called  
**Then** `SaveNote` request contains `metadata.labels == [Label("rust"), Label("learning")]`

### TC-AL-N-05 — Content command `/:labels` sets labels [S-UX-NE2]

**Given** a note being updated  
**When** content contains `/:labels rust learning project;`  
**Then** the resulting `SaveNote` request has `metadata.labels == [Label("rust"), Label("learning"), Label("project")]`

### TC-AL-N-06 — Content command `/:labels` is merged with panel labels [S-UX-NE2]

**Given** a note with panel labels `["panel-tag"]` and content `/:labels content-tag;`  
**When** `UpdateNote` is applied  
**Then** `metadata.labels` contains both `"panel-tag"` and `"content-tag"` (union, deduplicated)

### TC-AL-N-07 — PublishNote clears draft flag [S-DM-N5]

**Given** a model with a draft note loaded  
**When** `update(PublishNote { id: "space1/note1" }, &mut model)` is called  
**Then** the `SaveNote` storage request has `metadata.draft == false`

### TC-AL-N-08 — DeleteNote emits StorageRequest::DeleteNote

**Given** a model with note loaded  
**When** `update(DeleteNote { id: "space1/note1" }, &mut model)` is called  
**Then** effects include `StorageRequest::DeleteNote { id: "space1/note1" }`

### TC-AL-N-11 — UpdateNote with empty content does not emit SaveNote for draft [S-UX-NE4]

**Given** a model with a new (unsaved) note loaded and no existing draft  
**When** `update(UpdateNote { id: "space1/note1", content: "", labels: [] }, &mut model)` is called  
**Then** effects do NOT include any `StorageRequest::SaveNote` or `StorageRequest::SaveDraft`

### TC-AL-N-12 — UpdateNote with empty content when draft exists emits DeleteDraft [S-UX-NE4]

**Given** a model with note `"space1/note1"` that has `metadata.draft == true` on disk  
**When** `update(UpdateNote { id: "space1/note1", content: "", labels: [] }, &mut model)` is called  
**Then** effects include `StorageRequest::DeleteDraft { id: "space1/note1" }`  
**And** effects do NOT include `StorageRequest::SaveNote` or `StorageRequest::SaveDraft`

### TC-AL-N-09 — NoteDeleted triggers navigation back

**Given** a model currently on the note editor screen  
**When** `update(NoteDeleted { id: "space1/note1" }, &mut model)` is called  
**Then** effects include `Effect::Render`  
**And** `view(model).screen` is no longer `note_editor`

### TC-AL-N-10 — NoteLoaded transitions screen to note_editor

**Given** a model waiting for note load  
**When** `update(NoteLoaded { note }, &mut model)` is called  
**Then** `view(model).screen == "note_editor"` with the note data populated

---

## Note Description

### TC-AL-ND-01 — Note description is first non-heading, non-empty line [S-DM-N4]

**Given** note content:

```markdown
# My Note

First paragraph text.

Second paragraph.
```

**When** `view(model)` is called with this note loaded  
**Then** the view model's `description` field equals `"First paragraph text."`

### TC-AL-ND-02 — Note with only heading has empty description [S-DM-N4]

**Given** note content with only `# My Note` and no further text  
**When** `view(model)` is called  
**Then** `description` is empty or `None`

---

## Search and Filtering

### TC-AL-SF-01 — SearchChanged filters note list by title

**Given** a model with notes `["rust-intro", "learning-python", "rust-advanced"]` in the note list  
**When** `update(SearchChanged { query: "rust" }, &mut model)` is called  
**Then** `view(model)` shows only `"rust-intro"` and `"rust-advanced"` in the note list

### TC-AL-SF-02 — SetActiveView filters notes by label [S-DM-V1]

**Given** notes with labels `["rust"]`, `["python"]`, `["rust", "learning"]`  
**When** `update(SetActiveView { labels: ["rust"] }, &mut model)` is called  
**Then** `view(model)` shows only the two rust-labeled notes

### TC-AL-SF-03 — SetActiveView with multiple labels requires all labels present [S-DM-V1]

**Given** notes: A `["rust", "learning"]`, B `["rust"]`, C `["learning"]`  
**When** `update(SetActiveView { labels: ["rust", "learning"] }, &mut model)` is called  
**Then** only note A appears in `view(model)`

### TC-AL-SF-04 — ClearView restores unfiltered list

**Given** an active view is set  
**When** `update(ClearView, &mut model)` is called  
**Then** `view(model)` shows all notes in the current space

### TC-AL-SF-05 — Search and active view can combine

**Given** notes: A `["rust"]` title `"intro"`, B `["rust"]` title `"advanced"`, C `["python"]` title `"intro"`  
**When** active view is `["rust"]` and search query is `"intro"`  
**Then** `view(model)` shows only note A

### TC-AL-SF-06 — Empty search query shows all notes

**Given** a search query was previously set  
**When** `update(SearchChanged { query: "" }, &mut model)` is called  
**Then** `view(model)` shows all notes (filter removed)

### TC-AL-SF-07 — Available labels derived from cached notes [S-DM-L2]

**Given** a note list is loaded with notes labeled `["rust"]`, `["python"]`, `["rust"]`  
**When** `view(model)` is called  
**Then** the available labels list contains `"rust"` and `"python"` (deduplicated, no extra roundtrip)

---

## Effect Error

### TC-AL-ERR-01 — EffectError transitions model to error screen

**Given** any model state  
**When** `update(EffectError { message: "disk full" }, &mut model)` is called  
**Then** `view(model).screen == "error"` with the error message present

### TC-AL-ERR-02 — NavigateBack from error screen returns to overview

**Given** model in error state  
**When** `update(NavigateBack, &mut model)` is called  
**Then** `view(model).screen == "overview"` (or triggers LoadSpaces to restore state)
