# Glossary

Terms used across spec documents.

- **Space** — Container for notes; hierarchical, independent, manageable. Id uses dot notation leaf-to-root: `child.parent...root`. See [data model](data-model.md#spaces).
- **Note** — Primary content unit; markdown file with YAML front matter. Hierarchical: notes form trees. Id uses URL path notation root-to-leaf: `root/.../leaf`. See [data model](data-model.md#notes).
- **Label** — Single lowercase alphanumeric+hyphen word (`^[a-z0-9-]+$`) attached to notes/spaces for categorization and search.
- **View** — A named, stored set of filters over notes (`view://<name>`).
- **Folder note** — Storage convention where a note `foo.md` can be paired with a folder `foo/` containing its children, attachments, and draft.
- **Draft** — Separate in-progress file (`draft.md`) alongside a note. At most one per note. Existence is reflected in the note's `draft: bool` frontmatter.
- **Reference** — A URI link from a note to another artifact: `note://`, `space://`, `view://`, `file://`. Block-level granularity via `#block-id`.
- **Block-id** — Stable identifier for a block within a note, used as the target of intra-note and inter-note references. (Generation rule TBD — see [S-DM-NR5](data-model.md#note-references).)
- **Backlink** — Reverse of a forward reference; stored in the references index.
- **Index** — Derived JSON cache file in the data folder. Most indexes are regenerable from content; some (`views.json`, `settings.json`, `history.json`) are source-of-truth. See [storage](storage.md#indexes).
- **Source of truth** — Data that cannot be reconstructed from other artifacts and must be persisted.
- **Slug** — Normalized form of a string: lowercased, non-`[a-z0-9-]` characters replaced with hyphens. Used for note `title` and space names in ids.
- **Shell** — Platform-specific UI layer (desktop, web, mobile) wrapping the shared Rust core.
- **Data folder** — Root directory containing all user content and indexes for a workspace.
