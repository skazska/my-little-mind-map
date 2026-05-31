# Architecture

My Little Mind Map architecture

## Overview

Cross-platform

```mermaid
flowchart TB
    subgraph Shells["Platform Shells"]
        direction LR
        iOS["iOS<br/>SwiftUI"]
        Android["Android<br/>Compose"]
        Web["Web<br/>React"]
        Desktop["Desktop<br/>Tauri+React"]
    end
    Core["CRUX Shared Core (Rust)<br/>Events → update(Model) → Effects + ViewModel → render"]
    Backend["Backend Service (Axum)<br/>REST API for advanced features"]
    DB[("Database<br/>SQLite → PostgreSQL")]

    iOS -->|UniFFI| Core
    Android -->|UniFFI| Core
    Web -->|WASM| Core
    Desktop -->|Direct| Core
    Core -->|HTTP| Backend
    Backend --> DB
```

## CRUX Pattern

The shared core follows the Elm architecture:

1. **Event** — User interactions or system events sent from the shell
2. **Model** — Application state, owned by the core
3. **update()** — Pure function: `(Event, &mut Model) → Effects`
4. **ViewModel** — Serializable view data sent to the shell for rendering
5. **Capabilities** — Side effects (HTTP, storage, render) requested by the core

## Data Flow

```mermaid
sequenceDiagram
    participant Shell as Shell (UI)
    participant Core as Core.update()
    Shell->>Core: Event
    Core-->>Shell: ViewModel (render)
    Core->>Shell: Effects (execute)
    Shell->>Core: response
```
