# POC — Development Plan & Status

## POC Scope (from README)

> Desktop App with basic features: write, upload, paste from clipboard, screen-part capture, classify, link(bidirectional), sync to Backend Service.
> Backend Service with basic features: store, sync, manage data.

---

## Key Documents

| Document | Description |
|----------|-------------|
| [POC-requirements.md](POC-requirements.md) | All POC functional/non-functional requirements & use cases |
| [POC-decisions.md](POC-decisions.md) | Architectural & design decisions (D-001 through D-013) |
| [POC-phase-1-status.md](POC-phase-1-status.md) | Phase 1 detailed status & tasks |
| [POC-phase-2-status.md](POC-phase-2-status.md) | Phase 2 detailed status & tasks |
| [POC-phase-3-status.md](POC-phase-3-status.md) | Phase 3 detailed status & tasks |
| [POC-phase-4-status.md](POC-phase-4-status.md) | Phase 4 detailed status & tasks |
| [POC-phase-5-status.md](POC-phase-5-status.md) | Phase 5 detailed status & tasks |
| [POC-phase-6-status.md](POC-phase-6-status.md) | Phase 6 detailed status & tasks |
| [POC-phase-N-requirements.md](.) | Per-phase requirements (1 through 6) |

---

## POC Features

### Desktop App

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| D1 | **Write** | Create and edit text artifacts (markdown) | In progress |
| D2 | **Upload** | Upload files (images, documents) as artifacts | Not started |
| D3 | **Paste from clipboard** | Paste text, images from system clipboard | Not started |
| D4 | **Screen-part capture** | Capture a region of the screen as an artifact | Not started |
| D5 | **Classify** | Assign topics to artifacts | In progress |
| D6 | **Link (bidirectional)** | Create bidirectional links between artifacts and topics | Not started |
| D7 | **Sync to Backend** | Push/pull data to/from backend service | Not started |

### Backend Service

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| B1 | **Store** | Persist artifacts, topics, and relations | Not started |
| B2 | **Sync** | Receive and serve data to/from clients | Not started |
| B3 | **Manage data** | CRUD operations for artifacts, topics, relations | Not started |

---

## Infrastructure & Scaffolding

| # | Task | Status |
|---|------|--------|
| I1 | Monorepo structure (Cargo workspace + just) | Done |
| I2 | Shared CRUX core crate (`shared/`) | Done |
| I3 | Shared types crate (`shared_types/`) | Done |
| I4 | Backend service boilerplate (Axum, `/health`) | Done |
| I5 | Desktop app boilerplate (Tauri v2 + React) | Done |
| I6 | Web app boilerplate (React + Vite) | Done |
| I7 | Mobile app placeholders (iOS, Android) | Done |
| I8 | CI pipeline (GitHub Actions) | Done |
| I9 | Docker setup (backend Dockerfile, docker-compose) | Done |
| I10 | Developer documentation | Done |
| I11 | Release & publish documentation | Done |
| I12 | Tauri system deps installed & full workspace builds | Done |
| I13 | POC requirements, decisions, and detailed development plan | Done |

---

## Key Decisions Summary

> Full details: [POC-decisions.md](POC-decisions.md)

| ID | Topic | Decision |
|----|-------|----------|
| D-001 | Data model notation | Mermaid diagrams (ER + class) |
| D-002 | Local storage (desktop) | File-based: JSON indexes + markdown/media files |
| D-003 | Backend storage | File-based, per-user separation (same as desktop) |
| D-004 | Topic structure | Graph with typed relations (`subtopic-of`, `related-to`, `classifies`) |
| D-005 | Markdown content | Structured AST (mdast preferred, cross-platform spike needed) |
| D-006 | Sync strategy | Single-user ownership, manual conflict resolution |
| D-007 | Graph view | Defer to MVP2 |
| D-008 | Auto metadata | `created_at`, `updated_at`, `source_type` |
| D-009 | Reference index sync | Bidirectional sync between note text and reference index |
| D-010 | Text-centered | Notes are keystone; all non-text artifacts must be referenced |
| D-011 | Classification required | Every note needs ≥1 topic |
| D-012 | Single-user ownership | One user owns all data; no multi-user in POC |
| D-013 | Screen capture | Defer detailed decision to task 3.3; prefer Tauri/native APIs |

---

## Development Plan

### Phase 1: Data Model & Storage — [detailed status](POC-phase-1-status.md) | [requirements](POC-phase-1-requirements.md)

Define the core data model and implement file-based storage for desktop and backend.

| # | Task | Depends on | Status | Definition |
|---|------|-----------|--------|------------|
| 1.1 | Design data model (Mermaid ER + types) | — | Done | [task](POC-phase-1/1.1_design-data-model.md) |
| 1.2 | Add data model to shared CRUX core | 1.1 | Done | [task](POC-phase-1/1.2_add-data-model-to-crux.md) |
| 1.3 | File storage library (shared) | 1.1 | Done | [task](POC-phase-1/1.3_file-storage-library.md) |
| 1.4 | Desktop local storage integration | 1.2, 1.3 | Done | [task](POC-phase-1/1.4_desktop-local-storage.md) |
| 1.5 | Backend API: CRUD endpoints | 1.2, 1.3 | Done | [task](POC-phase-1/1.5_backend-api-crud.md) |
| 1.6 | Backend file storage integration | 1.3, 1.5 | Done | [task](POC-phase-1/1.6_backend-file-storage.md) |

### Phase 2: Desktop App — Write & Classify — [detailed status](POC-phase-2-status.md) | [requirements](POC-phase-2-requirements.md)

Build the core writing and classification experience in the desktop app.

| # | Task | Depends on | Status | Definition |
|---|------|-----------|--------|------------|
| 2.1 | Markdown editor with AST support (+ mdast spike) | Phase 1 | Done | [task](POC-phase-2/2.1_markdown-editor-ast.md) |
| 2.2 | Create/save note via CRUX → local storage | 2.1, Phase 1 | Done | [task](POC-phase-2/2.2_create-save-note.md) |
| 2.3 | Topic management (CRUD + typed relations) | Phase 1 | Not started | [task](POC-phase-2/2.3_topic-management.md) |
| 2.4 | Note list/browse view | 2.2 | Not started | [task](POC-phase-2/2.4_note-list-browse.md) |
| 2.5 | Topic filter/browse view | 2.3 | Not started | [task](POC-phase-2/2.5_topic-filter-browse.md) |

### Phase 3: Desktop App — Collect (Upload, Paste, Capture) — [detailed status](POC-phase-3-status.md) | [requirements](POC-phase-3-requirements.md)

Add more ways to collect artifacts.

| # | Task | Depends on | Status | Definition |
|---|------|-----------|--------|------------|
| 3.1 | File upload → artifact | 2.2 | Not started | [task](POC-phase-3/3.1_file-upload.md) |
| 3.2 | Paste from clipboard → artifact | 2.2 | Not started | [task](POC-phase-3/3.2_paste-from-clipboard.md) |
| 3.3 | Screen region capture → artifact | 2.2 | Not started | [task](POC-phase-3/3.3_screen-region-capture.md) |
| 3.4 | File/media preview in editor | 3.1 | Not started | [task](POC-phase-3/3.4_file-media-preview.md) |

### Phase 4: Linking — [detailed status](POC-phase-4-status.md) | [requirements](POC-phase-4-requirements.md)

Bidirectional links between notes and topics.

| # | Task | Depends on | Status | Definition |
|---|------|-----------|--------|------------|
| 4.1 | Link creation UI (note ↔ note, note ↔ topic) | 2.2, 2.3 | Not started | [task](POC-phase-4/4.1_link-creation-ui.md) |
| 4.2 | Bidirectional link storage and resolution | 1.2 | Not started | [task](POC-phase-4/4.2_bidirectional-link-storage.md) |
| 4.3 | Backlinks display | 4.2 | Not started | [task](POC-phase-4/4.3_backlinks-display.md) |
| 4.4 | Inline references with index sync | 4.1, 2.1 | Not started | [task](POC-phase-4/4.4_inline-references-sync.md) |

### Phase 5: Sync — [detailed status](POC-phase-5-status.md) | [requirements](POC-phase-5-requirements.md)

Sync local data with the backend service.

| # | Task | Depends on | Status | Definition |
|---|------|-----------|--------|------------|
| 5.1 | Sync protocol design | 1.1 | Not started | [task](POC-phase-5/5.1_sync-protocol-design.md) |
| 5.2 | CRUX HTTP capability | 5.1 | Not started | [task](POC-phase-5/5.2_crux-http-capability.md) |
| 5.3 | Push local changes to backend | 5.2, 1.5 | Not started | [task](POC-phase-5/5.3_push-local-changes.md) |
| 5.4 | Pull remote changes to local | 5.2, 1.5 | Not started | [task](POC-phase-5/5.4_pull-remote-changes.md) |
| 5.5 | Offline-first queue | 5.3, 5.4 | Not started | [task](POC-phase-5/5.5_offline-first-queue.md) |

### Phase 6: Polish & Release — [detailed status](POC-phase-6-status.md) | [requirements](POC-phase-6-requirements.md)

| # | Task | Depends on | Status | Definition |
|---|------|-----------|--------|------------|
| 6.1 | Error handling and user feedback | All above | Not started | [task](POC-phase-6/6.1_error-handling.md) |
| 6.2 | Keyboard shortcuts | 2.1 | Not started | [task](POC-phase-6/6.2_keyboard-shortcuts.md) |
| 6.3 | App settings (backend URL, sync interval, etc.) | 5.2 | Not started | [task](POC-phase-6/6.3_app-settings.md) |
| 6.4 | Desktop app packaging and release | 6.1 | Not started | [task](POC-phase-6/6.4_desktop-packaging.md) |
| 6.5 | Backend deployment | 6.1 | Not started | [task](POC-phase-6/6.5_backend-deployment.md) |

---

## Current Status

**Phase: Phase 2 in progress.**

### What's done

- Monorepo scaffolded: Cargo workspace with `shared`, `shared_types`, `backend-service`, `desktop-app/src-tauri`
- CRUX 0.17 shared core with minimal App implementation (Event, Model, ViewModel, Effect)
- Axum backend with `/health` endpoint
- Tauri v2 desktop shell with React frontend (calls CRUX core via Tauri commands)
- React web app scaffold (WASM integration pending)
- iOS/Android mobile placeholders
- `just` task runner with recipes for build, test, lint, dev
- GitHub Actions CI (Rust build + test + clippy, web app build)
- Docker setup for backend
- Developer and release documentation
- **POC requirements defined** — functional, non-functional, use cases ([POC-requirements.md](POC-requirements.md))
- **Architectural decisions made** — 13 decisions documented ([POC-decisions.md](POC-decisions.md))
- **Detailed development plan** — 6 phases, 29 tasks, each with task definition files
- **Phase 1 complete** — data model, shared core integration, file storage library, desktop local storage, backend CRUD and backend file storage are implemented
- **Phase 2 started** — markdown editor + mdast spike complete, create/save note flow complete, topic management and note browsing implementation now in progress

### What's next

**→ Continue Phase 2** — Topic Management (2.3) and Note List/Browse (2.4), then Topic Filter/Browse (2.5)

Current implementation is on a feature branch and covers the first Task 2.3 and 2.4 slices in the desktop app. The next concrete target is to complete acceptance criteria for topic CRUD + relations and finish dedicated topic-based browsing.

---

## Open Questions — Resolved

| Question | Decision | Reference |
|----------|----------|-----------|
| Should markdown content be stored as plain text or structured AST? | **Structured AST** (mdast preferred, spike in task 2.1) | D-005 |
| What metadata to capture automatically? | **`created_at`, `updated_at`, `source_type`** (typed/pasted/uploaded/captured) | D-008 |
| Graph view: implement in POC or defer to MVP2? | **Defer to MVP2** | D-007 |
| Local-first sync: use CRDTs or simpler approach? | **Single-user ownership + manual conflict resolution** | D-006, D-012 |
| Screen capture: use OS-native APIs or a Rust crate? | **Defer to task 3.3; prefer Tauri/native APIs** | D-013 |
