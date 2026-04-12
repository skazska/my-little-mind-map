# Project Structure

```
my-little-mind-map/
├── Cargo.toml              # Rust workspace root
├── justfile                 # Task runner recipes
├── rust-toolchain.toml      # Pinned Rust channel + components
├── docker-compose.yml       # Local dev services
│
├── shared/                  # CRUX shared core (business logic)
│   └── src/app.rs           # App trait: Event, Model, ViewModel, Effect
│
├── shared_types/            # FFI type generation (Swift, Kotlin, TypeScript)
│   └── src/lib.rs
│
├── backend-service/         # Axum REST API (sync & storage)
│   ├── src/main.rs
│   └── Dockerfile
│
├── desktop-app/             # Tauri v2 desktop shell
│   ├── src-tauri/           # Rust backend (Tauri commands → CRUX core)
│   ├── src/                 # React + TypeScript frontend
│   └── package.json
│
├── web-app/                 # React + WASM web shell
│   ├── src/                 # React + TypeScript frontend
│   └── package.json
│
├── mobile-apps/
│   ├── ios/                 # SwiftUI shell (placeholder)
│   └── android/             # Kotlin/Compose shell (placeholder)
│
├── docs/                    # Documentation
├── tests/                   # Integration / E2E tests
└── .github/workflows/       # CI/CD pipelines
```
