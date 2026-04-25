# POC — Requirements

This document defines POC-scoped requirements for My Little Mind Map. Requirements are derived from [IDEA.md](../IDEA.md) feature expectations and design decisions in [POC-decisions.md](POC-decisions.md).

> **Notation:** `IDEA##Section` references a section in IDEA.md. `D-NNN` references a decision in POC-decisions.md. Phase-specific requirements are in `POC-phase-N-requirements.md`.

---

## Functional Requirements — Desktop App

### FR-D1: Write

> Source: `IDEA##Plan/POC`: "write"; `IDEA##How/Collect`: "Write"; `IDEA##Key`: "Text centered"

| ID | Requirement |
|----|-------------|
| FR-D1.1 | User can create a new note (markdown text artifact) |
| FR-D1.2 | User can edit an existing note using a markdown editor |
| FR-D1.3 | Notes are stored as structured AST (D-005), serialized to markdown files |
| FR-D1.4 | Editor supports basic markdown: headings, bold, italic, lists, code blocks, links, images |
| FR-D1.5 | Editor supports internal references to other notes: `[[note-id\|display text]]` (D-009) |
| FR-D1.6 | Notes are auto-saved with `updated_at` timestamp (D-008) |
| FR-D1.7 | Note creation requires at least one topic classification (D-011) |

### FR-D2: Upload

> Source: `IDEA##Plan/POC`: "upload"; `IDEA##How/Collect`: "import from other apps"

| ID | Requirement |
|----|-------------|
| FR-D2.1 | User can upload files (images, documents) as artifacts |
| FR-D2.2 | Uploaded files are stored in the note's `assets/` folder (D-002) |
| FR-D2.3 | Upload automatically creates a reference in the associated note (D-010) |
| FR-D2.4 | Metadata records `source_type: uploaded` (D-008) |
| FR-D2.5 | Supported formats: PNG, JPEG, GIF, WebP, PDF, plain text (minimum for POC) |

### FR-D3: Paste from Clipboard

> Source: `IDEA##Plan/POC`: "paste from clipboard"; `IDEA##How/Collect`: "Write"

| ID | Requirement |
|----|-------------|
| FR-D3.1 | User can paste text from system clipboard into a note |
| FR-D3.2 | User can paste images from system clipboard as artifacts |
| FR-D3.3 | Pasted images are saved to the note's `assets/` folder (D-002) |
| FR-D3.4 | Paste automatically inserts a reference in the note content (D-010) |
| FR-D3.5 | Metadata records `source_type: pasted` (D-008) |

### FR-D4: Screen-Part Capture

> Source: `IDEA##Plan/POC`: "screen-part capture"; `IDEA##How/Collect`: "take photo/video/audio"

| ID | Requirement |
|----|-------------|
| FR-D4.1 | User can capture a selected region of the screen |
| FR-D4.2 | Captured image is saved as an artifact in the note's `assets/` folder |
| FR-D4.3 | Capture automatically inserts a reference in the note content (D-010) |
| FR-D4.4 | Metadata records `source_type: captured` (D-008) |

### FR-D5: Classify

> Source: `IDEA##Plan/POC`: "classify"; `IDEA##How/Collect`: "Classify artifacts by topics"; `IDEA##Key`: "Classification is required"

| ID | Requirement |
|----|-------------|
| FR-D5.1 | User can create topics |
| FR-D5.2 | User can assign one or more topics to a note |
| FR-D5.3 | Every note must have at least one topic (D-011) — enforced at save |
| FR-D5.4 | User can remove a topic from a note (unless it's the last one) |
| FR-D5.5 | User can create typed relations between topics: `subtopic-of`, `related-to`, `classifies` (D-004) |
| FR-D5.6 | Topics can classify other topics (recursive classification) (D-004) |
| FR-D5.7 | User can browse notes filtered by topic |

### FR-D6: Link (Bidirectional)

> Source: `IDEA##Plan/POC`: "link(bidirectional)"; `IDEA##How/Collect`: "Interlink artifacts, topics"; `IDEA##Like What`: "Roam Research: bidirectional links", "Logseq: backlinks"

| ID | Requirement |
|----|-------------|
| FR-D6.1 | User can create links between notes (note ↔ note) |
| FR-D6.2 | User can create links between notes and topics (note ↔ topic) |
| FR-D6.3 | All links are bidirectional — linking A→B automatically creates B→A |
| FR-D6.4 | Links are stored in the references index and in note content (D-009) |
| FR-D6.5 | User can view backlinks: all items that link to the current note/topic |
| FR-D6.6 | User can insert inline references in the markdown editor (`[[note-id\|text]]`) |
| FR-D6.7 | Deleting a note marks references in other notes as broken |

### FR-D7: Sync to Backend — Reconsidering

> Source: `IDEA##Plan/POC`: "sync to Backend Service"; `IDEA##Key`: "Local first, sync to backend service, but can work without it"
>
> **Reconsidering**: Custom backend sync API may be replaced by Cloudflare ArtifactFS. See [POC-results.md](POC-results.md).

| ID | Requirement |
|----|-------------|
| FR-D7.1 | User can push local changes to the backend service |
| FR-D7.2 | User can pull remote changes from the backend service |
| FR-D7.3 | App works fully offline — sync happens when connectivity is available |
| FR-D7.4 | Conflicts are presented to the user for manual resolution (D-006) |
| FR-D7.5 | Sync status is visible in the UI (synced / pending / conflict) |
| FR-D7.6 | Changes are queued when offline and synced when online (D-006) |

---

## Functional Requirements — Backend Service — Reconsidering

> **Reconsidering**: Custom backend service may be replaced by Cloudflare ArtifactFS. See [POC-results.md](POC-results.md).

### FR-B1: Store — Reconsidering

> Source: `IDEA##Plan/POC`: "store"; `IDEA##How/Store`: "Save data locally. Sync data to the cloud"

| ID | Requirement |
|----|-------------|
| FR-B1.1 | Backend persists notes, topics, relations, and assets received from clients |
| FR-B1.2 | Storage uses the same file-based layout as the desktop app (D-003) |
| FR-B1.3 | Data is stored per-user in separate directories (D-003, D-012) |
| FR-B1.4 | Backend preserves all metadata (timestamps, source_type, etc.) |

### FR-B2: Sync — Reconsidering

> Source: `IDEA##Plan/POC`: "sync"

| ID | Requirement |
|----|-------------|
| FR-B2.1 | Backend accepts push requests with changed entities from clients |
| FR-B2.2 | Backend serves pull requests with changes since a given version |
| FR-B2.3 | Backend detects version conflicts and rejects conflicting pushes (D-006) |
| FR-B2.4 | Backend provides a health check endpoint (`/health`) |

### FR-B3: Manage Data — Reconsidering

> Source: `IDEA##Plan/POC`: "manage data"

| ID | Requirement |
|----|-------------|
| FR-B3.1 | Backend provides CRUD API for notes |
| FR-B3.2 | Backend provides CRUD API for topics |
| FR-B3.3 | Backend provides CRUD API for relations (note↔note, note↔topic, topic↔topic) |
| FR-B3.4 | Backend validates data integrity (e.g., referenced topics exist) |

---

## Non-Functional Requirements

### NFR-1: Local-First

> Source: `IDEA##Key`: "Local first, sync to backend service, but can work without it"

| ID | Requirement |
|----|-------------|
| NFR-1.1 | All features except sync work without network connectivity |
| NFR-1.2 | Local data is the source of truth; backend is a sync target |
| NFR-1.3 | No data loss on network failure during sync |

### NFR-2: Text-Centered

> Source: `IDEA##Key`: "Text centered, text is a keystone artifact, other artifacts must be referenced in some text" (D-010)

| ID | Requirement |
|----|-------------|
| NFR-2.1 | Non-text artifacts cannot exist without a referencing note |
| NFR-2.2 | UI flows always center on note context |

### NFR-3: Cross-Platform Core

> Source: `IDEA##Tech Stack`: "CRUX"; architecture uses shared Rust core

| ID | Requirement |
|----|-------------|
| NFR-3.1 | Business logic lives in the shared CRUX core (`shared/` crate) |
| NFR-3.2 | Platform shells (Tauri, Web, Mobile) contain only UI and platform-specific code |
| NFR-3.3 | Data model types are shared via `shared_types/` crate |

### NFR-4: Data Integrity

| ID | Requirement |
|----|-------------|
| NFR-4.1 | Reference index stays in sync with note content (D-009) |
| NFR-4.2 | Classification constraint enforced at core level (D-011) |
| NFR-4.3 | Broken references are detected and surfaced to the user |

### NFR-5: Single-User Ownership

> Source: D-012

| ID | Requirement |
|----|-------------|
| NFR-5.1 | POC assumes single-user data ownership |
| NFR-5.2 | No authentication or authorization required in POC |
| NFR-5.3 | Backend prepares for multi-user with per-user directory isolation |

### NFR-6: Performance (POC baseline)

| ID | Requirement |
|----|-------------|
| NFR-6.1 | Note creation/save completes in < 500ms on desktop |
| NFR-6.2 | Note list loads in < 1s for up to 1000 notes |
| NFR-6.3 | Topic list loads in < 500ms for up to 100 topics |

### NFR-7: Status Bar

> Source: Testability and user awareness — users and developers need visibility into app runtime state.

| ID | Requirement |
|----|-------------|
| NFR-7.1 | All client apps (desktop, web, mobile) display a persistent status bar |
| NFR-7.2 | Status bar shows the storage directory path (D-014) |
| NFR-7.3 | Status bar shows current note and topic counts |
| NFR-7.4 | Status bar shows the app version |
| NFR-7.5 | Status bar is visible across all views without obstructing content |

---

## Use Cases & Scenarios

### UC-1: Create a New Note

> Actor: User | Features: FR-D1, FR-D5 | Phase: 2

1. User clicks "New Note"
2. Editor opens with empty markdown content
3. User types markdown text
4. User selects or creates at least one topic for classification
5. User saves — note is stored locally with metadata (`created_at`, `source_type: typed`)
6. Note appears in the note list and under the assigned topic(s)

### UC-2: Upload a File to a Note

> Actor: User | Features: FR-D2, FR-D6 | Phase: 3

1. User opens an existing note (or creates a new one)
2. User clicks "Upload" or drags a file into the editor
3. File is saved to the note's `assets/` folder
4. A reference (image embed or file link) is inserted into the note content
5. Reference index is updated (D-009)

### UC-3: Paste Image from Clipboard

> Actor: User | Features: FR-D3 | Phase: 3

1. User copies an image to the system clipboard (e.g., screenshot, web image)
2. User focuses the note editor and pastes (Ctrl+V)
3. Image is saved to the note's `assets/` folder with `source_type: pasted`
4. An image embed reference is inserted at cursor position
5. Reference index is updated

### UC-4: Capture Screen Region

> Actor: User | Features: FR-D4 | Phase: 3

1. User clicks "Capture Screen" button
2. Screen overlay appears, user selects a region
3. Captured image is saved to the current note's `assets/` folder with `source_type: captured`
4. Image embed is inserted into the note
5. Reference index is updated

### UC-5: Classify a Note

> Actor: User | Features: FR-D5 | Phase: 2

1. User opens note properties/sidebar
2. User sees currently assigned topic(s)
3. User searches/browses topics and selects additional topic
4. Classification is saved to `classifications.json` index
5. User can remove a topic unless it's the last one (error shown if attempted)

### UC-6: Create a Topic Relation

> Actor: User | Features: FR-D5 | Phase: 2

1. User opens topic management view
2. User selects a topic
3. User creates a relation: selects target topic and relation type (`subtopic-of`, `related-to`, `classifies`)
4. Relation is saved to `relations.json` index
5. Relation is visible from both topics (bidirectional)

### UC-7: Link Two Notes

> Actor: User | Features: FR-D6 | Phase: 4

1. User is editing note A
2. User inserts an internal reference: types `[[` to trigger autocomplete, selects note B
3. `[[note-b-id|Note B Title]]` is inserted into note A's content
4. Reference index updated: A→B and B→A entries created
5. When viewing note B, note A appears in backlinks

### UC-8: View Backlinks

> Actor: User | Features: FR-D6 | Phase: 4

1. User opens note B
2. Backlinks panel shows all notes that reference note B
3. User can click a backlink to navigate to the referencing note
4. Backlink shows the context (surrounding text) of the reference

### UC-9: Sync to Backend

> Actor: User | Features: FR-D7, FR-B1, FR-B2 | Phase: 5

1. User clicks "Sync" (or sync triggers automatically)
2. App compares local versions with backend versions
3. Changed local entities are pushed to backend
4. Changed remote entities are pulled to local
5. If conflict: user is shown both versions and chooses how to resolve
6. Sync status indicator updates (synced / pending / conflict)

### UC-10: Work Offline

> Actor: User | Features: FR-D7, NFR-1 | Phase: 5

1. User's device has no network connectivity
2. User creates, edits, classifies, and links notes — all operations work normally
3. Changes are queued locally
4. When connectivity returns, queued changes sync automatically
5. No data is lost

### UC-11: Browse Notes by Topic

> Actor: User | Features: FR-D5, FR-D1 | Phase: 2

1. User opens topic browser
2. User selects a topic
3. All notes classified under that topic are listed
4. User can further filter by sub-topics (via `subtopic-of` relations)
5. User clicks a note to open it

### UC-12: Manage Topics

> Actor: User | Features: FR-D5 | Phase: 2

1. User opens topic management
2. User can: create new topic, rename topic, view topic relations
3. User can create relations between topics (subtopic-of, related-to, classifies)
4. User can see all notes classified under a topic
5. User can see all topics that classify this topic (reverse classification)
