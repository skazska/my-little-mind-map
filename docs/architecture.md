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
│  │            REST API for sync & storage                  │  │
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

- `shared/` — CRUX shared core: business logic, state, events, view models
- `shared_types/` — Generated FFI types (Swift, Kotlin, TypeScript)
- `backend-service/` — Axum REST API
- `desktop-app/` — Tauri v2 + React desktop shell
- `web-app/` — React + WASM web shell
- `mobile-apps/ios/` — SwiftUI iOS shell
- `mobile-apps/android/` — Kotlin/Compose Android shell
- `docs/` — Documentation, ADRs
- `tests/` — Integration and E2E tests

## Tech Choices

| Component   | Technology             | Rationale                                        |
|-------------|------------------------|--------------------------------------------------|
| Shared Core | Rust + CRUX            | Single codebase for all biz logic, type-safe FFI |
| Backend     | Rust + Axum            | Tokio ecosystem, tower middleware, familiar      |
| Desktop     | Tauri v2               | Lightweight, drct Rust calls (no WASM overhead)  |
| Web         | React + WASM           | Standard web stack, CRUX WASM shell              |
| iOS         | Swift + SwiftUI        | Native UX, UniFFI bindings to shared core        |
| Android     | Kotlin + Compose       | Native UX, UniFFI bindings to shared core        |
| Monorepo    | Cargo workspace + just | Language-agnostic orchestration                  |
| JS tooling  | pnpm + Vite            | Fast, efficient package management and bundling  |
