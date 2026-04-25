# POC — Architectural & Design Decisions

This document records key decisions made for the POC scope. Each decision includes context, options considered, the chosen approach, and rationale.

> References use the format `IDEA##Section` for IDEA.md sections, `REQ-XXX` for requirements in [POC-requirements.md](POC-requirements.md) and `PLAN##Section` for [PLAN](PLAN.md) sections.

---

## D-001: Data Model Notation

**Context:** We need a common way to describe and communicate data models across the team and documentation.

**Options:**

| Option | Pros | Cons |
|--------|------|------|
| Mermaid diagrams (ER + class) | Renders in GitHub, VS Code, most markdown viewers; version-controllable as text | Limited expressiveness for complex constraints |
| Rust struct definitions | Implementation-ready, precise | Not visual, harder for non-Rust readers |
| Both Mermaid + Rust | Best of both worlds | Duplication, maintenance burden |

**Decision:** Mermaid diagrams (ER + class).

**Rationale:** Mermaid renders natively in GitHub and VS Code markdown preview, keeping documentation self-contained. Rust struct code will exist in the implementation but the authoritative design reference lives in Mermaid diagrams.

---

## D-002: Local Storage — Desktop App

**Context:** The desktop app needs to persist artifacts, topics, relations, and metadata locally. Must support offline-first operation. See `IDEA##Key`: "Local first, sync to backend service, but can work without it."

**Options:**

| Option | Pros | Cons |
|--------|------|------|
| SQLite via rusqlite | Full SQL, ACID, mature | Overkill for single-user, binary DB file hard to inspect |
| SQLite via sqlx | Async, compile-time queries | Same as above, plus heavier dependency |
| crux_kv (CRUX key-value) | CRUX-native | Poor for relational queries, limited |
| JSON files + flat files | Human-readable, git-friendly, inspectable, simple | No ACID, manual indexing needed |

**Decision:** File-based storage — JSON files for indexes + markdown/media files for content.

**Rationale:** Aligns with `IDEA##Key` principle "Text centered, text is a keystone artifact." Notes are stored as markdown files, non-text artifacts (images, documents) live alongside their referencing note. Metadata stored as JSON per note. Global index files track references, topics, relations, and classifications. This approach is human-readable, inspectable, and git-friendly. No ACID guarantees needed for single-user POC.

**Storage Layout:**

```
data/
├── notes/
│   ├── {note-id}/
│   │   ├── content.md          # Markdown content (structured AST serialized)
│   │   ├── meta.json           # Note metadata (created_at, updated_at, source_type)
│   │   └── assets/             # Non-text artifacts uploaded with this note
│   │       ├── image1.png
│   │       └── document.pdf
│   └── ...
├── topics/
│   └── topics.json             # All topics with their properties
├── index/
│   ├── references.json         # All note↔note, note↔asset references (bidirectional)
│   ├── classifications.json    # All note↔topic, topic↔topic classifications
│   └── relations.json          # Typed relations between topics
└── config.json                 # Storage format version, user settings
```

**Content Addressing:** Desirable for future deduplication and integrity checks. In POC, use UUID-based note IDs. Content hashes can be added as a metadata property (`content_hash`) for future use.

**Reference Properties:**

- `isOriginal`: whether this is where the artifact was first uploaded
- `type`: relation type (e.g., "embeds", "links-to", "references")
- `content_hash`: optional, for content addressing

---

## D-003: Backend Storage

**Context:** The backend service needs to store synced data from clients.

**Options:**

| Option | Pros | Cons |
|--------|------|------|
| SQLite/PostgreSQL | Query power, ACID, scalable | Different storage model from desktop, sync complexity |
| File-based (same as desktop) | Consistent with desktop, simple sync (file diff), inspectable | No query optimization, filesystem limits at scale |

**Decision:** File-based for POC, per-user separation (same layout as desktop).

**Rationale:** Using the same storage format on backend and desktop simplifies sync enormously for POC — sync becomes essentially file/delta transfer. Per-user directory separation (`data/{user-id}/...`) provides isolation. Database can be introduced in MVP1+ when query performance matters.

---

## D-004: Topic Structure

**Context:** Topics classify artifacts. Need to decide how topics relate to each other. See `IDEA##What for?`: "structure (Artifacts relations, Topics relations, Artifacts-Topics relations, Topic-hierarchy, Angles)."

**Options:**

| Option | Pros | Cons |
|--------|------|------|
| Flat list | Simplest | No structure, poor for navigation |
| Tree (parent_id) | Familiar hierarchy | Only one parent, rigid |
| Graph with typed relations | Flexible, supports multiple relation types | More complex to implement |

**Decision:** Graph — topics as nodes with typed relations. Topics can classify other topics.

**Rationale:** The IDEA envisions rich topic structure including hierarchy, angles, and inter-topic relations. A graph model with typed edges naturally supports "subtopic-of" (hierarchy), "related-to" (associations), and recursive classification (topics classifying topics). Flat list is too limited; rigid tree prevents the multi-perspective structure described in `IDEA##What for?`.

**Relation Types (POC):**

- `subtopic-of` — hierarchical parent-child
- `related-to` — general association
- `classifies` — one topic classifies another (recursive classification)

---

## D-005: Markdown Content Storage Format

**Context:** Artifacts contain markdown text. Need to decide storage format. See `IDEA##Key`: "Text centered, text is a keystone artifact."

**Options:**

| Option | Pros | Cons |
|--------|------|------|
| Plain text markdown | Simple, universal, any editor can open | No structured queries on content, references are just text |
| Structured AST (mdast) | Rich querying, reference extraction, programmatic manipulation | More complex storage, parser dependency |
| Custom block-based | Like Notion/Logseq blocks, fine-grained references | Most complex, non-standard |

**Decision:** Structured AST. Prefer mdast (Markdown Abstract Syntax Tree) if cross-platform compatible (Rust + JS). Otherwise, custom AST from Rust markdown parser with shared spec.

**Rationale:** Structured AST enables programmatic extraction and sync of references (D-009), content analysis, and future AI features. mdast is the standard from the unified/remark ecosystem (JS) and has Rust support via `markdown-rs`. Cross-platform compatibility must be validated (see task 2.1 spike).

**Evaluation Criteria for mdast:**

1. Can `markdown-rs` (Rust) produce AST compatible with `remark` (JS)?
2. Is round-trip fidelity maintained (AST → markdown → AST)?
3. Can we extend for custom nodes (e.g., internal references `[[note-id]]`)?

**Fallback:** If mdast doesn't work cross-platform, define a custom AST spec in the `shared` crate, with serialization for both Rust and TypeScript consumption.

**Spike Result (Task 2.1):** Cross-platform compatibility validated. See [mdast-evaluation.md](POC-phase-2/mdast-evaluation.md).

- JS `remark-parse` produces authoritative mdast JSON stored as `serde_json::Value` in Rust
- Rust `markdown` crate (v1.0) produces correct mdast but lacks serde support — not needed since JS handles AST serialization
- `[[uuid|text]]` references extracted via string scanning in Rust (`shared/src/references.rs`) and regex in JS
- Editor: split-pane textarea + `react-markdown` preview
- Fallback not needed — mdast works cross-platform

---

## D-006: Sync Strategy

**Context:** Desktop app syncs local data with the backend. See `IDEA##Key`: "Local first, sync to backend service, but can work without it."

**Options:**

| Option | Pros | Cons |
|--------|------|------|
| Last-write-wins (timestamps) | Simplest | Data loss on concurrent edits |
| CRDTs (e.g., Automerge) | Robust, automatic merge | Complex, heavy dependency, overkill for single-user |
| Manual conflict resolution | User controls, no data loss | Requires conflict UI, user effort |

**Decision:** Single-user data ownership with manual conflict resolution.

**Rationale:** POC is single-user — the user owns all data. Conflicts can only arise from the same user editing on multiple devices before syncing. Manual conflict resolution preserves user intent without data loss. CRDTs are overkill for this scenario.

**Model:**

- Each client has a local version counter per entity
- On sync push, backend accepts if server version matches expected; rejects if conflict
- On conflict, client pulls server version and presents both to user for manual merge
- Future: owner-controlled actions to merge external data (e.g., shared topics from other users)

> **Note:** Update `IDEA##Key` to reflect single-user data ownership model (see D-012).

---

## D-007: Graph View

**Context:** Visual graph of notes and topics. See `IDEA##Like What`: "Obsidian: graph view" and `PLAN##MVP2`: "Better visualisation of data and relations e.g. graph view, mind map view."

**Decision:** Defer to MVP2.

**Rationale:** Graph visualization is significant effort (rendering engine, layout algorithms, interaction). POC focuses on core data operations: create, classify, link, sync. List/browse views are sufficient for POC navigation. Graph view is explicitly listed under MVP2 in IDEA.

---

## D-008: Automatic Metadata

**Context:** What metadata to capture automatically when creating artifacts. See `IDEA##How/Collect`: "Classify artifacts by topics, tag datetime locations and other metadata."

**Options:**

| Option | Metadata fields |
|--------|----------------|
| Datetime only | `created_at`, `updated_at` |
| Datetime + source | + `source_type` (typed, pasted, uploaded, captured) |
| Datetime + source + location | + `location` (GPS or contextual) |

**Decision:** Datetime + source type.

**Fields:**

- `created_at`: ISO 8601 timestamp, set on creation
- `updated_at`: ISO 8601 timestamp, updated on every save
- `source_type`: enum — `typed`, `pasted`, `uploaded`, `captured`

**Rationale:** Source type provides useful context for how an artifact was collected (aligns with `IDEA##How/Collect` which lists write, paste, upload, capture as distinct collection methods). Location adds platform-specific complexity (GPS permissions, desktop location APIs) — defer to future.

---

## D-009: Reference Index Sync

**Context:** Notes contain markdown references to other notes and artifacts. These references also exist in the global index (`index/references.json`). The two must stay in sync. See `IDEA##Key`: "other artifacts must be referenced in some text."

**Decision:** In-text markdown references must stay bidirectionally in sync with the references index.

**Mechanism:**

1. **On save:** Parse note AST, extract all references (internal links, asset embeds), update `references.json` to match
2. **On reference index change** (e.g., linked note deleted): Update referencing note's AST to mark reference as broken/orphaned
3. **Reference format in markdown:** `[[note-id|display text]]` for internal note links, `![alt](assets/filename)` for embedded assets

**Rationale:** The `IDEA##Key` principle "other artifacts must be referenced in some text" means the index is derived from text content. Text is the source of truth for references; the index is a computed cache for fast lookups and backlink resolution.

---

## D-010: Text-Centered Design

**Context:** `IDEA##Key`: "Text centered, text is a keystone artifact, other artifacts must be referenced in some text."

**Decision:** Notes (text/markdown) are the keystone artifact type. All other artifact types (images, documents, audio, etc.) must be referenced from at least one note.

**Implications:**

- Non-text artifacts cannot exist as standalone top-level entities
- Upload/paste/capture operations create or attach to a note
- Deleting the last referencing note should warn about orphaned assets
- The UI always starts from or returns to a note context

---

## D-011: Classification Required

**Context:** `IDEA##Key`: "Classification is required."

**Decision:** Every note must be classified with at least one topic.

**Implications:**

- Note creation flow must include topic selection/creation
- Cannot save a note without at least one topic
- Topic management (create, rename, merge) is a first-class feature
- UI enforces this constraint at the CRUX core level (validation in `update()`)

---

## D-012: Single-User Data Ownership

**Context:** POC is designed for single-user use. Data belongs to one user.

**Decision:** Single-user data ownership model. One user owns all data in a storage instance. No multi-user collaboration in POC.

**Implications:**

- No user authentication in POC (single implicit user)
- Backend stores data per-user directory (prepared for multi-user future)
- Sync conflicts are same-user multi-device conflicts only
- Future: owner-controlled actions to merge/accept external data
- `IDEA##Key` to be updated to include: "Single-user data ownership."

---

## D-013: Screen Capture Implementation

**Context:** POC feature D4 requires capturing a screen region as an artifact. See `IDEA##Plan/POC`: "screen-part capture."

**Options:**

| Option | Pros | Cons |
|--------|------|------|
| OS-native APIs via Tauri | Native look and feel, reliable | Platform-specific code |
| Rust crate (e.g., `screenshots`) | Cross-platform Rust | May not support region selection UI |
| External tool invocation | Leverage existing tools (gnome-screenshot, etc.) | Dependency on external tools |

**Decision:** Defer detailed decision to task 3.3. Evaluate Tauri screenshot plugins and Rust crates. OS-native APIs via Tauri plugin are the preferred direction.

---

## D-014: Status Bar

**Context:** During development and testing it is difficult to determine where the app stores data, which version is running, or how much data exists. Users and developers need visibility into runtime state.

**Options:**

| Option | Pros | Cons |
|--------|------|------|
| Log to console only | No UI work | Not visible to non-developer users |
| Settings/about page | Standard pattern | Requires navigation, not always visible |
| Persistent status bar | Always visible, low cognitive cost | Uses screen space |

**Decision:** Persistent status bar at the bottom of all client apps (desktop, web, mobile).

**Content:**

- **Storage path** — absolute path to the data directory (platform-specific)
- **Counts** — current number of notes and topics (derived from ViewModel)
- **App version** — from platform API (e.g., Tauri `getVersion()`)

**Rationale:** A persistent status bar provides at-a-glance runtime info without requiring navigation. Storage path visibility is critical for testing and debugging (knowing which data directory is in use). Counts give a quick sanity check that data is loaded. Version helps with issue reporting.

**Implementation Notes:**

- Storage path is a shell-specific concern — exposed via platform command (e.g., Tauri `get_storage_path`), not via the shared CRUX ViewModel
- Counts are derived from existing ViewModel arrays (`notes.length`, `topics.length`)
- Version is obtained from the platform API (Tauri, browser, mobile OS)
- Status bar must truncate long paths with ellipsis to stay single-line
- Each platform shell implements its own StatusBar component following platform conventions

---

## Decisions Index

| ID | Topic | Decision Summary |
|----|-------|-----------------|
| D-001 | Data model notation | Mermaid diagrams |
| D-002 | Local storage (desktop) | File-based: JSON indexes + markdown/media files |
| D-003 | Backend storage | File-based, per-user separation |
| D-004 | Topic structure | Graph with typed relations |
| D-005 | Markdown content format | Structured AST (mdast preferred) |
| D-006 | Sync strategy | Single-user ownership, manual conflict resolution |
| D-007 | Graph view | Defer to MVP2 |
| D-008 | Auto metadata | `created_at`, `updated_at`, `source_type` |
| D-009 | Reference index sync | Bidirectional sync between text and index |
| D-010 | Text-centered design | Notes are keystone; non-text must be referenced |
| D-011 | Classification required | Every note needs ≥1 topic |
| D-012 | Single-user ownership | One user owns all data, no multi-user in POC |
| D-013 | Screen capture | Defer to task 3.3; prefer Tauri/native APIs |
| D-014 | Status bar | Persistent status bar in all apps showing storage path, counts, version |
