# POC — Development Plan & Status

## POC Scope (from README)

> Desktop App with basic features: write, upload, paste from clipboard, screen-part capture, classify, link(bidirectional), sync to Backend Service.
> Backend Service with basic features: store, sync, manage data.

---

## POC Features

### Desktop App

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| D1 | **Write** | Create and edit text artifacts (markdown) | Not started |
| D2 | **Upload** | Upload files (images, documents) as artifacts | Not started |
| D3 | **Paste from clipboard** | Paste text, images from system clipboard | Not started |
| D4 | **Screen-part capture** | Capture a region of the screen as an artifact | Not started |
| D5 | **Classify** | Assign topics to artifacts | Not started |
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
| I12 | Tauri system deps installed & full workspace builds | Blocked — needs `sudo apt-get install` on dev machine |

---

## Development Plan

### Phase 1: Data Model & Storage

Define the core data model and persist it locally and on the backend.

| # | Task | Depends on | Status |
|---|------|-----------|--------|
| 1.1 | Design data model (Artifact, Topic, Relation, Metadata) | — | Not started |
| 1.2 | Add data model to shared CRUX core | 1.1 | Not started |
| 1.3 | Local storage in desktop app (SQLite via `crux_kv` or direct) | 1.2 | Not started |
| 1.4 | Backend API: CRUD endpoints for artifacts, topics, relations | 1.1 | Not started |
| 1.5 | Backend storage (SQLite via sqlx) | 1.4 | Not started |
| 1.6 | Database migrations setup | 1.5 | Not started |

### Phase 2: Desktop App — Write & Classify

Build the core writing and classification experience in the desktop app.

| # | Task | Depends on | Status |
|---|------|-----------|--------|
| 2.1 | Text editor component (markdown) in React frontend | 1.2 | Not started |
| 2.2 | Create/save artifact via CRUX core → local storage | 2.1, 1.3 | Not started |
| 2.3 | Topic management (create, list, assign to artifact) | 1.2 | Not started |
| 2.4 | Artifact list/browse view | 2.2 | Not started |
| 2.5 | Topic filter/browse view | 2.3 | Not started |

### Phase 3: Desktop App — Collect (Upload, Paste, Capture)

Add more ways to collect artifacts.

| # | Task | Depends on | Status |
|---|------|-----------|--------|
| 3.1 | File upload (images, documents) → artifact | 2.2 | Not started |
| 3.2 | Paste from clipboard (text, image) → artifact | 2.2 | Not started |
| 3.3 | Screen region capture → artifact | 2.2 | Not started |
| 3.4 | File/media preview in artifact view | 3.1 | Not started |

### Phase 4: Linking

Bidirectional links between artifacts and topics.

| # | Task | Depends on | Status |
|---|------|-----------|--------|
| 4.1 | Link creation UI (artifact ↔ artifact, artifact ↔ topic) | 2.2, 2.3 | Not started |
| 4.2 | Bidirectional link storage and resolution | 1.2 | Not started |
| 4.3 | Backlinks display (show what links to current item) | 4.2 | Not started |
| 4.4 | Inline link insertion in markdown editor | 4.1, 2.1 | Not started |

### Phase 5: Sync

Sync local data with the backend service.

| # | Task | Depends on | Status |
|---|------|-----------|--------|
| 5.1 | Sync protocol design (conflict resolution strategy) | 1.1 | Not started |
| 5.2 | CRUX HTTP capability for backend communication | 5.1 | Not started |
| 5.3 | Push local changes to backend | 5.2, 1.4 | Not started |
| 5.4 | Pull remote changes to local | 5.2, 1.4 | Not started |
| 5.5 | Offline-first: queue changes when offline, sync when online | 5.3, 5.4 | Not started |

### Phase 6: Polish & Release

| # | Task | Depends on | Status |
|---|------|-----------|--------|
| 6.1 | Error handling and user feedback | All above | Not started |
| 6.2 | Keyboard shortcuts | 2.1 | Not started |
| 6.3 | App settings (backend URL, sync interval, etc.) | 5.2 | Not started |
| 6.4 | Desktop app packaging and release | 6.1 | Not started |
| 6.5 | Backend deployment | 6.1 | Not started |

---

## Current Status

**Phase: Infrastructure complete. Ready to start Phase 1.**

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

### What's next

**→ Phase 1.1: Design the data model**

Key decisions needed:

- Artifact structure (what fields, how to store content vs metadata)
- Topic hierarchy (flat list vs tree)
- Relation types (artifact↔artifact, artifact↔topic, topic↔topic)
- Local storage format (SQLite schema, or key-value via crux_kv)
- Sync strategy (last-write-wins, CRDTs, or manual conflict resolution)

---

## Open Questions

- [ ] Should markdown content be stored as plain text or structured AST?
- [ ] What metadata to capture automatically (datetime, location, source)?
- [ ] Graph view: implement in POC or defer to MVP2?
- [ ] Local-first sync: use CRDTs (e.g. Automerge) or simpler approach?
- [ ] Screen capture: use OS-native APIs or a Rust crate?
