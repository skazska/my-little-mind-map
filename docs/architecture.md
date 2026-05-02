# Architecture

## Overview

My Little Mind Map is a cross-platform application for collecting, storing, growing, and managing knowledge contexts.

```
┌───────────────────────────────────────────────────────────────┐
│                        Platform Shells                        │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │   iOS    │  │ Android  │  │   Web    │  │    Desktop    │  │
│  │ SwiftUI  │  │ Compose  │  │  React   │  │ Tauri+React   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬────────┘  │
│       │UniFFI       │UniFFI       │WASM           │Direct     │
│  ┌────┴─────────────┴─────────────┴───────────────┴────────┐  │
│  │              CRUX Shared Core (Rust)                    │  │
│  │  Events → update(Model) → Effects + ViewModel → render  │  │
│  └─────────────────────────┬───────────────────────────────┘  │
│                            │ HTTP                             │
│  ┌─────────────────────────┴───────────────────────────────┐  │
│  │            Backend Service (Axum)                       │  │
│  │            REST API for advanced features               │  │
│  └──────────────────────────┬──────────────────────────────┘  │
│                             │                                 │
│  ┌──────────────────────────┴──────────────────────────────┐  │
│  │            Database (SQLite → PostgreSQL)               │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

## CRUX Pattern

The shared core follows the Elm architecture:

1. **Event** — User interactions or system events sent from the shell
2. **Model** — Application state, owned by the core
3. **update()** — Pure function: `(Event, &mut Model) → Effects`
4. **ViewModel** — Serializable view data sent to the shell for rendering
5. **Capabilities** — Side effects (HTTP, storage, render) requested by the core

## Data Flow

```
Shell (UI) ──Event──► Core.update() ──Effects──► Shell (execute)
     ▲                     │                          │
     └──── ViewModel ◄─────┘     response ────────────┘
```

## Folder Structure

TBD

## Tech Choices

TBD