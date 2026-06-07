# Storage Spec

Spec IDs in this document use the `S-ST-*` prefix. See [data model](data-model.md) for content semantics.

Satisfies: [E-LOCAL-FIRST](../expectations.md) (`S-ST-LS*`, `S-ST-DM*`), [E-SYNC](../expectations.md) (`S-ST-CS*`, `S-ST-SYN*`), [E-STANDARDS](../expectations.md) (`S-ST-DM*` human-readable JSON).

## Cloud Storage

- [S-ST-CS1] Git compatible. Sync is delegated to **version-control hosting** rather than a bespoke cloud backend (see [E-SYNC](../expectations.md)). [TBD post-POC] Research and evaluation of git-compatible hosting options by ease of integration, performance, cost, etc.: GitHub, GitLab, Bitbucket, Cloudflare Artifacts, …

## Local Storage

- [S-ST-LS1] Local storage: same approach across all apps.
- [S-ST-LS2] Desktop: file-system based. Git versioning. Can run on any project folder as storage.
- [S-ST-LS3] Web app: File System Access API (FSA). User grants the web app access to a folder on disk.
  - **Browser support:** Chrome, Edge (latest); Firefox (limited); Safari (not supported). [TBD post-POC] research into fallback strategies (e.g., OPFS) for unsupported browsers.
  - **Security model:** User explicitly grants per-folder access; operations are confined to the selected folder.
  
## Sync

- [S-ST-SYN1] Sync: via git-compatible operations.
- [S-ST-SYN2] [TBD post-POC] Conflict resolution: **delegate to git**. Expected: merge of markdown is text-merge; indexes ([S-ST-IX1]) are regenerated post-merge from content rather than text-merged; frontmatter conflicts surface to the user. Full spec pending.

## Storage Data Model

- [S-ST-DM1] Data folder structure: folder-note.
- [S-ST-DM2] Structured and index data: JSON files.
- [S-ST-DM3] Note content: Markdown files with YAML front matter (see [S-DM-N6](data-model.md#notes)).
- [S-ST-DM4] Data folder structure:

```text
data_folder/
   |- definitions.json   <- definitions index (derived)
   |- references.json    <- note-note references index (derived)
   |- labels.json        <- labels index (derived)
   |- notes.json         <- notes index (derived from spaces/)
   |- spaces.json        <- space metadata (name, description, labels — source-of-truth); hierarchy (child_ids, note_count — derived from spaces/)
   |- views.json         <- named views index (source of truth)
   |- settings.json      <- user settings (source of truth)
   |- history.json       <- recent activity and changes (source of truth)
   `- spaces/
       |- space1/                          <space://space1>
       |   |- note1.md                     <note://space1/note1>
       |   `- subspace1/                   <space://subspace1.space1>
       |       |- note1.md                 <note://subspace1.space1/note1>
       |       `- note1/
       |           |- draft.md             <draft of note://subspace1.space1/note1>
       |           |- note1.md             <note://subspace1.space1/note1/note1>
       |           `- attachments/         (TBD future)
       |               `- file.txt         <file://subspace1.space1/note1/note1/attachments/file.txt>
       `- space2/
           |- note2.md                     <note://space2/note2>
```

- [S-ST-DM5] Note-folder vs child-space disambiguation: a path segment under `spaces/` is a **note** iff a sibling `<segment>.md` file exists; a directory without such a sibling is a **child space**. A note's owning space is the space whose root-first path is the **longest prefix** of the note's id segments; descendant notes (folder-notes) belong to the same space as their ancestor, while notes under a child-space directory belong to that child space. `list_notes(space)` returns the space's full owned subtree (all descendant folder-notes) but **excludes** notes owned by nested child spaces.

## Indexes

- [S-ST-IX1] Index files are **derived caches** unless explicitly marked source-of-truth:
  - Fully regenerable from note content alone: `labels.json`, `definitions.json`, `references.json`.
  - Fully regenerable from the `spaces/` folder structure and note contents: `notes.json`.
  - **Hybrid** (partially source-of-truth, partially derived): `spaces.json` — `name`, `description`, and `labels` are **source-of-truth** (must be persisted; cannot be recovered from folder layout alone); `child_ids` and `note_count` are **derived** and regenerable from `parent_id` chains and note files.
  - **Not regenerable** (source of truth, must be persisted and committed): `views.json`, `settings.json`, `history.json`.
- [S-ST-IX2] Derived indexes MAY be committed for performance but MUST be reproducible from sources; any divergence is resolved by regeneration. This applies to the derived portions of hybrid indexes (e.g. `child_ids` and `note_count` in `spaces.json`); source-of-truth portions are governed by the Not-regenerable rule above and must always be persisted.
