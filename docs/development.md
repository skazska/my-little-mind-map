# Developer Guide

## Prerequisites

Install the following tools before starting development.

### Required (all platforms)

| Tool | Version | Install |
|------|---------|---------|
| **Rust** | stable (via rustup) | [rustup.rs](https://rustup.rs/) |
| **just** | latest | `cargo install just` |
| **Node.js** | 22 LTS+ | [fnm](https://github.com/Schniz/fnm) or [nvm](https://github.com/nvm-sh/nvm) |
| **pnpm** | 10+ | `corepack enable && corepack prepare pnpm@latest --activate` |
| **Docker** | 24+ | [docker.com](https://docs.docker.com/get-docker/) (for backend containers) |

### Linux (Ubuntu/Debian) — Tauri system dependencies

```bash
sudo apt-get update
sudo apt-get install -y \
  pkg-config \
  libwebkit2gtk-4.1-dev \
  #libappindicator3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf \
  libgtk-3-dev \
  libsoup-3.0-dev \
  libjavascriptcoregtk-4.1-dev
```

### macOS — Tauri system dependencies

Xcode Command Line Tools (usually already installed):

```bash
xcode-select --install
```

### Windows — Tauri system dependencies

Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with the "Desktop development with C++" workload. WebView2 is included in Windows 10/11.

### Mobile development (optional, for later)

| Platform | Tool | Install |
|----------|------|---------|
| iOS | Xcode 15+ | Mac App Store |
| iOS | Rust target | `rustup target add aarch64-apple-ios` |
| Android | Android Studio | [developer.android.com](https://developer.android.com/studio) |
| Android | Rust targets | `rustup target add aarch64-linux-android armv7-linux-androideabi` |
| Android | NDK | Via Android Studio SDK Manager |

---

## Clone & Setup

```bash
# Clone the repo
git clone https://github.com/<org>/my-little-mind-map.git
cd my-little-mind-map

# Rust toolchain is auto-installed via rust-toolchain.toml on first cargo command.
# Verify:
rustc --version
cargo --version

# Install just (task runner)
cargo install just

# Install JS dependencies for all frontend apps
just setup

# Verify everything builds
just build
```

### Quick verification

```bash
just ci          # fmt-check + clippy + test (all Rust crates)
just build       # cargo build --workspace
just dev-backend # start backend on http://localhost:3000
```

---

## Project Structure

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

---

## Development Workflows

### Available `just` recipes

Run `just` (no arguments) to see all available recipes:

```
just              # list all recipes
just build        # build all Rust crates
just test         # run all Rust tests
just lint         # clippy with warnings as errors
just fmt          # format all Rust code
just fmt-check    # check formatting (CI-safe)
just ci           # fmt-check + lint + test
just dev-backend  # run backend service
just dev-desktop  # run desktop app (Tauri dev mode)
just dev-web      # run web app (Vite dev server)
just build-desktop # build desktop release
just build-web     # build web production bundle
just setup        # install all JS dependencies
```

### Backend Service

```bash
# Start in dev mode (auto-recompiles on save with cargo-watch, if installed)
just dev-backend

# Or manually:
cargo run -p backend-service

# Verify:
curl http://localhost:3000/health
# → {"status":"ok"}

# Run with custom log level:
RUST_LOG=debug cargo run -p backend-service
```

**Port:** 3000 (hardcoded in `backend-service/src/main.rs`)

### Desktop App (Tauri + React)

```bash
# Start in dev mode (hot-reload for frontend, auto-rebuild for Rust)
just dev-desktop

# Or manually:
cd desktop-app
pnpm install
pnpm tauri dev

# Build release:
just build-desktop
# Output: desktop-app/src-tauri/target/release/bundle/
```

**Dev URLs:**

- Vite dev server: `http://localhost:1420`
- Tauri window loads from the Vite dev server

### Web App (React)

```bash
# Start in dev mode
just dev-web

# Or manually:
cd web-app
pnpm install
pnpm dev

# Build for production:
just build-web
# Output: web-app/dist/
```

**Dev URL:** `http://localhost:5173` (default Vite port)

### Shared Core (CRUX)

The shared core is a pure Rust library. Changes to it are automatically picked up by the desktop and backend crates.

```bash
# Build shared core only
cargo build -p shared

# Run core tests
cargo test -p shared

# Build with typegen feature (for FFI type generation)
cargo build -p shared --features typegen
```

---

## Testing

### Unit tests

```bash
just test                    # all Rust tests
cargo test -p shared         # shared core only
cargo test -p backend-service # backend only
```

### Linting

```bash
just lint        # clippy, warnings = errors
just fmt-check   # formatting check
```

### Full CI pipeline locally

```bash
just ci   # runs: fmt-check → lint → test
```

### Frontend type checking

```bash
cd web-app && npx tsc --noEmit
cd desktop-app && npx tsc --noEmit
```

---

## Local Infrastructure

### Docker Compose

```bash
# Start all services (backend)
docker compose up -d

# View logs
docker compose logs -f backend

# Stop
docker compose down

# Rebuild after code changes
docker compose up -d --build
```

### Backend without Docker

```bash
just dev-backend
# Starts on http://localhost:3000
```

### Future: Database

When a database is added, uncomment the `db` service in `docker-compose.yml`:

```yaml
db:
  image: postgres:17
  environment:
    POSTGRES_USER: mindmap
    POSTGRES_PASSWORD: mindmap_dev
    POSTGRES_DB: mindmap
  ports:
    - "5432:5432"
```

Then set `DATABASE_URL` for the backend:

```bash
DATABASE_URL=postgres://mindmap:mindmap_dev@localhost:5432/mindmap cargo run -p backend-service
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RUST_LOG` | `info` | Log level for backend (`debug`, `info`, `warn`, `error`) |
| `DATABASE_URL` | — | Database connection string (future) |
| `PORT` | `3000` | Backend listen port (future, currently hardcoded) |

Create a `.env` file in the project root for local overrides (loaded by `justfile`'s `set dotenv-load`):

```bash
# .env
RUST_LOG=debug
```

---

## Code Style & Conventions

### Rust

- **Format:** `cargo fmt` (enforced in CI)
- **Lint:** `cargo clippy` with `-D warnings` (enforced in CI)
- **Edition:** 2024 (set in workspace `Cargo.toml`)
- **Dependencies:** add shared deps to `[workspace.dependencies]`, reference with `.workspace = true`

### TypeScript / React

- **Format/Lint:** (to be configured — Prettier + ESLint recommended)
- **Framework:** React 19, Vite 6, TypeScript strict mode
- **Package manager:** pnpm only — do not use npm or yarn

### Git

- Branch from `main`
- PR required for merge
- CI must pass before merge

---

## Troubleshooting

### `cargo build --workspace` fails with pkg-config errors

Install Tauri system dependencies for your OS (see [Prerequisites](#linux-ubuntudebian--tauri-system-dependencies)).

### `pnpm install` shows "Ignored build scripts: esbuild"

This is a pnpm 10 security feature. The build still works. To suppress, run `pnpm approve-builds` and approve `esbuild`.

### Tauri dev mode: blank window

Ensure the Vite dev server is running on port 1420. Check `desktop-app/src-tauri/tauri.conf.json` → `build.devUrl`.

### Rust analyzer slow in VS Code

Add to `.vscode/settings.json`:

```json
{
  "rust-analyzer.check.command": "clippy",
  "rust-analyzer.cargo.buildScripts.enable": true
}
```

### `fnm` / `node` not found after install

```bash
# If installed via fnm, ensure it's in PATH:
export PATH="$HOME/.local/share/fnm:$PATH"
eval "$(fnm env)"
```
