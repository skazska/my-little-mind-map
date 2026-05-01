# Specs

This section contains technical specifications for the MindMap product.
It includes detailed descriptions of the system architecture, design decisions, data models, APIs, and other technical aspects that guide the development and implementation of the product.

## Data Model

### Tags

- [SDM-T1] Tags are single words consisting of alphanumeric characters and hyphens all lowercase, attachable to other entities (e.g., spaces, notes) for categorization and search.
- [SDM-T2] Tags are recurrent and reusable across the system, allowing for flexible organization and retrieval of information.
- [SDM-T3] Tags can be added by typing it.
- [SDM-T4] Tags can be cleared if not used automatically.
- [SDM-T5] Tags available for search and subsequent auto-completion and suggestions.
- [SDM-T6] Sets of tags serve as topics. To be gathered from notes `tags` metadata and `tags://` links in content, from spaces tags and stored with statistics in index for search and suggestions.

### Spaces

- [SDM-S1] Spaces are organized in a hierarchical structure, allowing for nested subspaces.
- [SDM-S2] Spaces are self-identified by their path in the hierarchy consisting of space names.
- [SDM-S3] Spaces are independent and manageable.
- [SDM-S4] Space names are unique within the same parent space, alphanumeric characters and hyphens only, spaces replaced with hyphens, all lowercase.
- [SDM-S5] Spaces can have tags.
- [SDM-S6] Spaces must have descriptions.

### Notes

- [SDM-N1] Notes are the primary content units organized hierarchically.
- [SDM-N2] Notes can have subnotes, allowing for a tree structure of notes.
- [SDM-N3] Notes can have tags.
- [SDM-N4] Root Notes contained in spaces. Notes must have unique titles within the same parent or container space.
- [SDM-N5] Notes are identified by their path in the hierarchy consisting of note titles.
- [SDM-N6] Notes are markdown files with front matter for metadata. No syntax requiring custom MDAST node.
- [SDM-N7] First line under title counted as description.

#### Tags in notes

- [SDM-NT1] Note tags are stored in note's front matter as `tags` string of space-separated words, No content tags syntax.

#### Attachments in notes

- [SDM-NA1] Notes can have files attached.

#### References in notes

- [SDM-NR1] Notes can reference other notes, spaces or external resources using links in the content.
- [SDM-NR2] All references are markdown links, definitions or active-texts.
- [SDM-NR3] Internal references to other notes and spaces are links and definitions with custom URI scheme, e.g., `[link text](ref://<space.path>[/<note.path>[<query>]])`. This allows for a consistent and flexible way to reference internal entities across user spaces while avoiding conflicts.
- [SDM-NR4] Attached files can be referenced using markdown links, e.g., `[file name](file://<relative.file.path>)`.
- [SDM-NR5] Notes content can have `tags` active text `[some-active-text][tags-view:<tag>&<tag>&<tag>]` to open view of topic set.
- [SDM-NR6] Note-to-note references are bi-directional and support block-level granularity:
  - [SDM-NR6-1] forward link query: [text](ref://space/note[#block-id][?query]) - links to a specific block in the target note, allowing for precise referencing and navigation.
  - [SDM-NR6-2] backlink: block-id where the reference is made is stored in references index.

#### Note metadata

- [SDM-NM1] Notes metadata:
  - `space` - main space (required for root notes) not applicable for subnotes.
  - `referenes` - list of all references with their type (note, space, tags, file) and target (path or url) synced from content.
  - `tags` - string of space-separated words.
  - `created_at` - timestamp of note creation. Set automatically.
  - `updated_at` - timestamp of last note update. Set automatically.
  - `title` - normalized title of the note, used for note path and file name. Alphanumeric characters and hyphens only, spaces replaced with hyphens, all lowercase. Synced from content.
  - `draft` - boolean indicating if there is note's draft. Set to true by default.
  - `uuid` - unique identifier for the note, used for reference and indexing. Generated automatically on note creation, immutable.
- [SDM-NM2] references, title must sync from content.

## Storage

### Cloud storage

- [SST-CS1] Git compatible preferable.
GitHub, GitLab, Bitbucket, Cloudflare Artifacts [TBD - research and evaluation of options for cloud storage with git compatibility, ease of integration, performance, cost, etc.].

### Local storage

- [SST-LS1] Preferably same approach for all apps.
- [SST-LS2] Preferably file system based for desktop app to allow git versioning and run on any project's folder as storage.
- [SST-LS3] Desktop use local file system for storage, this allows git versioning and run on any project's folder as storage.
- [SST-LS4] Web app use [TBD - research and evaluation of options for local storage compatable with git in web app].
- [SST-LS5] Mobile app use [TBD - research and evaluation of options for local storage compatable with git in mobile app].

### Sync

- [SST-SYN1] Sync between local and cloud storage is best to be achievable via git operations.

### Storage Data model

- [SST-DM1] Data folder structured in Folder Note notation.
- [SST-DM2] Json files for structured (tags, spaces, references) and index data.
- [SST-DM3] Markdown files with front matter for notes.
- [SST-DM4] Data folder structure:

```text
data_folder/
   |- references.json <- list of all note-note references with target, source, etc.>
   |- tags.json <- list of all tags with their metadata, e.g., usage count, related tags, etc.>
   |- tags/
   |   |- sets.json <- list of all tag sets with their metadata, e.g., tags included, usage count, etc.>
   |- history.json <- recent activity and history of changes>
   |- settings.json <- user settings and preferences>
   |- spaces.json <- hierarchical structure of spaces with their metadata, e.g., tags, etc.>
   `- spaces/
       |- space1/
       |   |- note1.md <ref://space1/note1>
       |   `- subspace1/
       |       |- note1.md <ref://space1/subspace1/note1>
       |       `- note1/
       |           |- draft.md <draft of subspace1/note1 for editing>
       |           |- note1.md <ref://space1/subspace1/note1/note1>
       |           `- attachments/
       |               `- file.txt <file://space1/subspace1/note1/note1/attachments/file.txt> | <attachments/file.txt>
       `- space2/
           |- note2.md <ref://space2/note2>
```

- [SST-DM5] Note `space` metadata must sync with note's placement in space when it is root.

## UX

### Starting the app

- [UX-SA1] Provides 4 overview options: spaces, tags, recent activity, and search.
- [UX-SA2] Has search bar with auto-completion and suggestions for spaces, tags, tag sets, and notes.
- [UX-SA3] Has options
  - [UX-SA3-1] to create new space, note.
  - [UX-SA3-3] to access history and recent activity.
- [UX-SA4] Has status bar
  - [UX-SA4-1] current data folder path and sync status.
  - [UX-SA4-2] version and settings access.
- [UX-SA5] Asks user to select or create data folder on first launch, with option to skip and use default folder.
- [UX-SA6] Provides onboarding guide for new users, accessible from start screen and settings.

### Observing

- [UX-OB1] Navigate spaces with descriptions, tags and stats with, filters, search, and note listing as result.
- [UX-OB2] Navigate tags with descriptions, usage count and related tags with, filters, search, and note listing as result.
- [UX-OB3] Navigate tag sets with tags included, usage count with, filters, search, and note listing as result.
- [UX-OB4] Navigate recent notes with summaries and metadata with, filters, search.

### Note listing and viewing

- [UX-NLV1] Notes listed within observicng context.
- [UX-NLV2] Notes listed with title and tags in short, and with description and metadata in details.
- [UX-NLV3] Notes can be sorted and filtered by title, tags, created_at, updated_at, etc.
- [UX-NLV4] Notes can be searched by title, tags, content, etc.
- [UX-NLV5] Notes can veiwed in rendered preview.
- [UX-NLV6] Notes can be opened in editor.

### Note editing

- [UX-NE1] Space/parent/note and tags displayed in panel above content or on top inside, synced, allow interactions, expandable to show all metadata and actions.
  - [UX-NE1-1] space/parent/note - indicating note's position in hierarchy, absence of space/parent or title, allows triger move.
  - [UX-NE1-2] tags - showing note's tags, allows to add/remove tags.
  - [UX-NE1-3] buttons for actions like add file, capture screen part, etc.
- [UX-NE2] Note editor with markdown support and live preview.
- [UX-NE3] As few UI controls as possible, with preference for text commands, markdown syntax, and in-content elements and interactions.
  - [UX-NE3-1] non-serializable commands in content editor: `/:command [<arg>];` - allow to trigger actions.
  - [UX-NE3-1] `title` displayed in note-path in status-bar.
  - [UX-NE3-2] `tags` set via `/:tags <tag1> <tag2> <tag3>;` command in content.
- [UX-NE4] Sync note draft in note's folder as `draft.md` while editing, remove on save, load on edit.

## Configuration

- [CFG-1] Path to data folder and sync settings is platform-specific and stored in app settings.
- [CFG-2] Other settings and preferences are stored in `settings.json` in data folder.

## Architecture

[See architecture.md](architecture.md)

- [ARCH-1] Shared core in Rust with UniFFI bindings for platform shells.
- [ARCH-2] Maximize shared logic and minimize platform-specific code in shells.
- [ARCH-3] Prefer shells implemented in native UI frameworks for best performance and user experience, with fallback to web-based shell if needed for cross-platform consistency and development speed.