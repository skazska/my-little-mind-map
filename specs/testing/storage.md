# Test Cases: Storage

Integration tests for filesystem-backed storage — CRUD operations, file layout, and index synchronization.

**Layer**: Integration (`storage/tests/integration_test.rs`, `tokio::test`, `tempfile::TempDir`); E2E (`product/web-app/tests/e2e/specs/`)
**Spec coverage**: [S-DM-L2], [S-DM-L3], [S-DM-L4], [S-DM-N5], [S-DM-N6], [S-DM-N1], [S-DM-NR4], [S-DM-S1], [S-DM-S4], [S-DM-V3], [S-ST-DM1], [S-ST-DM2], [S-ST-DM3], [S-ST-DM4], [S-ST-DM5], [S-ST-IX1], [S-ST-IX2], [S-ST-LS3], [S-DM-N7], [S-CFG-2], [S-CFG-3], [S-UX-ERR]
**Provisional coverage**: [S-DM-ND1], [S-DM-ND2]
**Integration implementation**: `product/storage/tests/integration_test.rs`
**E2E implementation**: `product/web-app/tests/e2e/specs/03-space-management.spec.ts`, `product/web-app/tests/e2e/specs/05-note-editor.spec.ts`
**Implementation status**: All test cases implemented unless marked `[skipped]`.

**Conventions**:

- Each test heading lists the spec IDs it covers in `[S-...]` brackets.
- `(provisional)` next to a spec ID flags coverage of a `[TBD]` spec; the test will be revisited once the spec is finalised.
- A `> Covers ... only.` note below a test scopes its coverage when the underlying spec is partially `[TBD]` (e.g. delete tests pending [S-DM-MV3]).

---

## Spaces — CRUD

### TC-ST-SP-01 — Create and retrieve space [S-ST-DM1]

**Given** an empty data folder  
**When** `create_space(&space)` is called with a valid `Space { id: "my-space", name: "My Space", ... }`  
**Then** `get_space(&space_id)` returns `Some(space)` with all fields intact

### TC-ST-SP-02 — Space directory created on disk [S-ST-DM4]

**Given** an empty data folder  
**When** `create_space(&space)` is called  
**Then** the directory `{data_root}/spaces/my-space/` exists on the filesystem

### TC-ST-SP-03 — Nested space directory uses reversed dot notation [S-ST-DM4]

**Given** a space with id `"sub.parent.root"`  
**When** `create_space(&space)` is called  
**Then** the directory `{data_root}/spaces/root/parent/sub/` exists

### TC-ST-SP-04 — List spaces returns all created spaces [S-ST-DM1]

**Given** three spaces created with ids `"alpha"`, `"beta"`, `"gamma"`  
**When** `list_spaces()` is called  
**Then** the result contains all three spaces

### TC-ST-SP-05 — Get non-existent space returns None [S-ST-DM1]

**Given** an empty data folder  
**When** `get_space(&unknown_id)` is called  
**Then** it returns `Ok(None)`

### TC-ST-SP-06 — Delete space removes directory and index entry [S-ST-DM1], [S-ST-DM4]

> Covers basic file-remove only. Cascade and reference-cleanup semantics are pending [S-DM-MV3].

**Given** a space that exists  
**When** `delete_space(&space_id)` is called  
**Then** `get_space(&space_id)` returns `Ok(None)`  
**And** the directory `{data_root}/spaces/my-space/` no longer exists  
**And** the space is absent from `spaces.json`

### TC-ST-SP-07 — Delete non-existent space returns error [S-ST-DM1]

**Given** no space with the given ID  
**When** `delete_space(&unknown_id)` is called  
**Then** it returns an `Err`

### TC-ST-SP-08 — Spaces index (spaces.json) reflects hierarchy [S-ST-DM1], [S-ST-IX1]

**Given** a parent space `"parent"` and child space `"child.parent"` created  
**When** `get_spaces_index()` is called  
**Then** the index entry for `"parent"` has `child_ids` containing `"child.parent"`

---

## Notes — CRUD

### TC-ST-N-01 — Create and retrieve note [S-ST-DM3]

**Given** a space and a valid `Note` with content and metadata  
**When** `create_note(&note)` is called  
**Then** `get_note(&note_id)` returns `Some(note)` with content and all metadata fields intact

### TC-ST-N-02 — Note file created at correct path [S-ST-DM4]

**Given** a note with id `"space1/parent-note"`  
**When** `create_note(&note)` is called  
**Then** the file `{data_root}/spaces/space1/parent-note.md` exists

### TC-ST-N-03 — Nested note file created at correct path [S-ST-DM4]

**Given** a note with id `"space1/parent/child"`  
**When** `create_note(&note)` is called  
**Then** the file `{data_root}/spaces/space1/parent/child.md` exists

### TC-ST-N-04 — Note file contains valid front matter [S-ST-DM3]

**Given** a note with labels and references  
**When** `create_note(&note)` is called  
**Then** the `.md` file on disk starts with `---` and contains a valid YAML block with all metadata fields

### TC-ST-N-05 — Update note persists changed content [S-ST-DM1], [S-ST-DM3]

**Given** a note that already exists  
**When** `update_note(&note)` is called with modified `content` and `labels`  
**Then** `get_note(&note_id)` returns the note with the new content and labels

### TC-ST-N-06 — Update note updates `updated_at` timestamp [S-DM-N5]

**Given** a note that was created at time T  
**When** `update_note(&note)` is called at time T+1  
**Then** the returned note has `metadata.updated_at > T`

### TC-ST-N-07 — Delete note removes file [S-ST-DM1], [S-ST-DM4]

> Covers basic file-remove only. Cascade, soft-delete, and reference-cleanup semantics are pending [S-DM-MV3].

**Given** a note that exists  
**When** `delete_note(&note_id)` is called  
**Then** `get_note(&note_id)` returns `Ok(None)`  
**And** the `.md` file no longer exists on disk

### TC-ST-N-08 — Delete note removes companion folder [S-ST-DM4]

**Given** a note `"space1/parent"` that has a child note `"space1/parent/child"` (creating `space1/parent/` dir)  
**When** `delete_note(&parent_id)` is called  
**Then** `{data_root}/spaces/space1/parent.md` is removed  
**And** `{data_root}/spaces/space1/parent/` directory is removed

### TC-ST-N-09 — Get non-existent note returns None [S-ST-DM1]

**Given** no note with the given ID  
**When** `get_note(&unknown_id)` is called  
**Then** it returns `Ok(None)`

### TC-ST-N-10 — List notes returns the space subtree, excluding child-space notes [S-DM-N1], [S-DM-S1], [S-ST-DM5]

**Given** notes `"space1/a"`, `"space1/b"`, and `"space1/a/child"` created in `space1`, plus a note `"space1/sub/cnote"` owned by child space `"sub.space1"`  
**When** `list_notes(&space1)` is called  
**Then** the result contains `"space1/a"`, `"space1/b"`, and the descendant `"space1/a/child"` (the full owned subtree)  
**And** it does NOT contain `"space1/sub/cnote"` (that note belongs to the child space)  
**And** `list_notes(&"sub.space1")` contains `"space1/sub/cnote"` with `parent_id == None` (it is a root note of the child space)

---

## Labels Index

### TC-ST-LI-01 — Labels index populated on create [S-DM-L2]

**Given** a note with `labels: ["rust", "learning"]`  
**When** `create_note(&note)` is called  
**Then** `get_labels_index()` has `"rust"` → `[note_id]` and `"learning"` → `[note_id]`

### TC-ST-LI-02 — Labels index updated on note update [S-DM-L3]

**Given** a note with label `"old-label"` that is updated to have label `"new-label"` (removing `"old-label"`)  
**When** `update_note(&note)` is called  
**Then** `get_labels_index()` maps `"new-label"` → `[note_id]`  
**And** `"old-label"` is no longer present (unused labels auto-pruned) [S-DM-L3]

### TC-ST-LI-03 — Labels index cleaned on note delete [S-DM-L3]

**Given** only one note with label `"unique-label"`  
**When** `delete_note(&note_id)` is called  
**Then** `get_labels_index()` does not contain `"unique-label"` at all

### TC-ST-LI-04 — Label shared by multiple notes remains after partial delete [S-DM-L3]

**Given** two notes both labeled `"shared"`  
**When** one note is deleted  
**Then** `get_labels_index()` still maps `"shared"` to the remaining note

### TC-ST-LI-05 — Cross-cutting labels span spaces [S-DM-L2]

**Given** a note in `"space1"` and a note in `"space2"` both labeled `"cross"`  
**When** `get_labels_index()` is called  
**Then** `"cross"` maps to both note IDs from different spaces

### TC-ST-LI-06 — Label index entry exposes statistics [S-DM-L4]

**Given** three notes labeled `"rust"` across two spaces  
**When** `get_labels_index()` is called  
**Then** the entry for `"rust"` carries `note_count == 3` and a `spaces` set of size 2 (or equivalent statistics fields)

### TC-ST-VI-01 — View index entry exposes statistics [S-DM-V3]

**Given** a saved view `"learning-rust"` whose filter matches 5 notes  
**When** `get_views_index()` is called  
**Then** the entry for that view carries `matching_note_count == 5` and the persisted filter labels

### TC-ST-SI-01 — Space index entry exposes note_count statistics [S-DM-S4]

**Given** a space `"work"` containing 4 notes  
**When** `get_spaces_index()` is called  
**Then** the entry for `"work"` carries `note_count == 4`

### TC-ST-SI-02 — Space index entry exposes label_count statistics [S-DM-S4]

**Given** a space `"work"` whose notes use 7 distinct labels  
**When** `get_spaces_index()` is called  
**Then** the entry for `"work"` carries `label_count == 7` (or equivalent distinct-label statistics field)

---

## References Index

### TC-ST-RI-01 — Forward reference stored on note create [S-DM-NR4]

**Given** a note with a reference to `"space1/target-note"` in its metadata  
**When** `create_note(&note)` is called  
**Then** `get_references_index()` has a forward entry: `source_note_id → target_note_id`

### TC-ST-RI-02 — Backlink stored on note create [S-DM-NR4]

**Given** a note with a reference to `"space1/target-note"` in its metadata  
**When** `create_note(&note)` is called  
**Then** `get_references_index()` has a backward entry: `target_note_id → source_note_id`

### TC-ST-RI-03 — References index rebuilt on update [S-DM-NR4]

**Given** a note that originally referenced `"space1/old-target"`, updated to reference `"space1/new-target"`  
**When** `update_note(&note)` is called  
**Then** the old forward/backward mappings for `"space1/old-target"` are removed  
**And** new mappings for `"space1/new-target"` are present

### TC-ST-RI-04 — References index cleared on delete [S-DM-NR4]

**Given** a note with a reference to another note  
**When** `delete_note(&note_id)` is called  
**Then** `get_references_index()` has no entries for the deleted note (neither source nor target)

---

## Definitions Index

> **Provisional**: covers the currently implemented candidate definition behaviour in [S-DM-ND1] and [S-DM-ND2]. Broader syntax options and richer definition metadata remain deferred.

### TC-ST-DI-01 — Definitions indexed on note create [S-DM-ND1], [S-DM-ND2] (provisional)

**Given** a note whose content contains a markdown definition (e.g., `**Term** Definition text`)  
**When** `create_note(&note)` is called  
**Then** `get_definitions_index()` maps `"term"` (lowercase) to the definition entry pointing to this note

### TC-ST-DI-02 — Definitions removed on note delete [S-DM-ND2] (provisional)

**Given** only one note that defines a term  
**When** `delete_note(&note_id)` is called  
**Then** `get_definitions_index()` no longer contains that term

### TC-ST-DI-03 — Definitions index rebuilt on note update [S-DM-ND2] (provisional)

**Given** a note whose content initially contains `**Old** ...` and is later updated to `**New** ...`  
**When** `update_note(&note)` is called  
**Then** `get_definitions_index()` no longer contains `"old"` for that note and does contain `"new"`

### TC-ST-DI-04 — Multiple definitions from one note are indexed [S-DM-ND1], [S-DM-ND2] (provisional)

**Given** a note whose content contains multiple candidate definition lines  
**When** `create_note(&note)` is called  
**Then** each valid definition term is added to `get_definitions_index()`

### TC-ST-DI-05 — Invalid candidate definition lines are ignored [S-DM-ND1] (provisional)

**Given** a note whose content contains candidate definition lines with an empty, whitespace-only, or missing term, or with empty definition text  
**When** `create_note(&note)` is called  
**Then** those lines do not produce any definitions index entries

---

## Settings

### TC-ST-SET-01 — Default settings returned when file absent [S-CFG-2], [S-CFG-3]

**Given** a data folder with no `settings.json`  
**When** `get_settings()` is called  
**Then** it returns a `Settings` value with default/empty fields (no error)

### TC-ST-SET-02 — Settings round-trip [S-ST-DM2]

**Given** a `Settings { data_folder: Some("/some/path"), theme: Some("dark"), ... }`  
**When** `update_settings(&settings)` then `get_settings()` is called  
**Then** the returned settings match the original exactly

### TC-ST-SET-03 — Settings stored as JSON [S-ST-DM2]

**Given** settings saved via `update_settings`  
**When** the `settings.json` file is read directly  
**Then** it is valid JSON containing the saved field values

---

## Error Handling

### TC-ST-ERR-01 — Create note in non-existent space creates parent dirs [S-ST-DM1], [S-UX-ERR]

**Given** a data folder where `spaces/my-space/` does not exist  
**When** `create_note(&note)` is called for a note in `"my-space"`  
**Then** it succeeds and creates the necessary directories

### TC-ST-ERR-02 — Corrupt front matter file returns error [S-DM-N6], [S-UX-ERR]

**Given** a `.md` file on disk that contains invalid YAML in the front matter block  
**When** `get_note(&note_id)` is called  
**Then** it returns an `Err` (storage error wrapping a parse error), not a panic

### TC-ST-ERR-03 — Concurrent reads do not error [S-ST-DM1]

**Given** a note that exists  
**When** `get_note` is called concurrently from multiple tasks  
**Then** all calls return `Ok(Some(note))` with consistent data

### TC-ST-ERR-04 — note_count in spaces index is accurate [S-DM-S4], [S-ST-IX1]

**Given** a space with 3 notes created and 1 deleted  
**When** `get_spaces_index()` is called  
**Then** the entry for that space has `note_count == 2`

---

## Index Reproducibility

### TC-ST-IX-01 — Derived indexes reproducible after deletion [S-ST-IX2]

**Given** a data folder with several spaces, notes (some with labels and references) and the derived indexes `labels.json`, `references.json`, `notes.json`, `spaces.json`, `definitions.json` populated  
**When** all derived index files are deleted from disk and `rebuild_indexes()` is invoked  
**Then** each derived index file is recreated  
**And** its contents are byte-equivalent (or value-equivalent after canonicalisation) to the snapshot taken before deletion  
**And** source-of-truth files (`views.json`, `settings.json`, `history.json`) are untouched

---

## Web Virtual File Tree (S-ST-LS3)

Test cases for the web app's browser-local virtual file tree, which mirrors the [S-ST-DM4](../specs/storage.md) folder-note layout using path-keyed `localStorage` entries (`mlmm:file:<path>`).

**Layer**: E2E (`product/web-app/tests/e2e/specs/03-space-management.spec.ts`, `product/web-app/tests/e2e/specs/05-note-editor.spec.ts`)  
**Spec coverage**: [S-ST-LS3], [S-ST-DM4], [S-ST-IX1], [S-ST-IX2], [S-DM-N7], [S-DM-N5]

> **ImplementationDev follow-up**: the `.spec.ts` test descriptions currently borrow desktop `TC-ST-*` codes or use bare spec-refs. Wire the canonical `TC-ST-LS3-*` codes below into the test descriptions in `product/web-app/tests/e2e/specs/03-space-management.spec.ts` and `product/web-app/tests/e2e/specs/05-note-editor.spec.ts`.

---

### TC-ST-LS3-01 — Note save creates path-keyed markdown file under spaces/ [S-ST-LS3], [S-ST-DM4]

**Given** the user creates a note in a space and types content in the web editor  
**When** the autosave debounce fires  
**Then** a `localStorage` entry with key `mlmm:file:spaces/<space>/<note>/draft.md` is created  
**And** its value is a valid markdown file with YAML front matter containing the typed content  
**And** no legacy `mlmm:data` blob key is present

**Implementation**: `TC-E2E-NE-06-web` / `TC-ST-N-02/TC-ST-N-04` in `product/web-app/tests/e2e/specs/05-note-editor.spec.ts`

---

### TC-ST-LS3-02 — Derived index files updated on note save [S-ST-LS3], [S-ST-IX1], [S-ST-IX2]

**Given** a note is saved to the web local store  
**When** the autosave debounce fires  
**Then** `mlmm:file:labels.json` reflects any labels on the note  
**And** `mlmm:file:notes.json` contains an entry for the note with correct `id`, `path`, and `draft` flag  
**And** `mlmm:file:definitions.json` is updated to include any `**Term** Definition` patterns in the note content  
**And** no legacy `mlmm:data` blob key is present

**Implementation**: `TC-E2E-NE-06-web`, `TC-ST-DI-01` in `product/web-app/tests/e2e/specs/05-note-editor.spec.ts`

---

### TC-ST-LS3-03 — Draft file removed when editor content is cleared [S-ST-LS3], [S-DM-N7]

**Given** a note with an existing draft file at `spaces/<space>/<note>/draft.md`  
**When** the editor content is cleared and the autosave debounce fires  
**Then** the `mlmm:file:spaces/<space>/<note>/draft.md` `localStorage` key is removed

**Implementation**: `TC-E2E-NE-16/TC-AL-N-12` in `product/web-app/tests/e2e/specs/05-note-editor.spec.ts`

---

### TC-ST-LS3-04 — Publish replaces draft file with published markdown [S-ST-LS3], [S-DM-N7], [S-ST-DM4], [S-DM-N5]

**Given** a note with an existing draft file at `spaces/<space>/<note>/draft.md`  
**When** the user publishes the note  
**Then** `mlmm:file:spaces/<space>/<note>/draft.md` is removed  
**And** `mlmm:file:spaces/<space>/<note>.md` exists with `draft: false` in its front matter

**Implementation**: `TC-E2E-NE-13/TC-DM-FM-09` in `product/web-app/tests/e2e/specs/05-note-editor.spec.ts`

---

### TC-ST-LS3-05 — spaces.json space metadata is source-of-truth [S-ST-LS3], [S-ST-IX1]

**Given** a space is created via the web app  
**When** `mlmm:file:spaces.json` is read  
**Then** the entry for that space contains the correct `name`, `description`, and `labels` values  
**And** `child_ids` and `note_count` reflect the current derived state (regenerable from folder structure)

**Implementation**: `TC-E2E-SP-01-ls` in `product/web-app/tests/e2e/specs/03-space-management.spec.ts`

---

### TC-ST-LS3-06 — Nested note keys mirror folder-note layout [S-ST-LS3], [S-ST-DM4]

**Given** a web local store space contains a parent note at `spaces/<space>/<parent>/draft.md`  
**When** a child note is saved with id `<space>/<parent>/<child>`  
**Then** the draft file is stored at `mlmm:file:spaces/<space>/<parent>/<child>/draft.md`  
**And** publishing removes the draft key and stores `mlmm:file:spaces/<space>/<parent>/<child>.md` with `draft: false`

**Implementation**: `TC-ST-LS3-06` in `product/web-app/tests/e2e/specs/05-note-editor.spec.ts`
