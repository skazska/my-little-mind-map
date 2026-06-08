# AGENTS.md

## Project

Multi-platform mind-mapping / personal knowledge management tool. Rust shared core (CRUX pattern: `Event → update(Model) → Effects + ViewModel`), with platform shells (Tauri 2 desktop, React web, SwiftUI iOS, Compose Android). WASM shared core for web, direct linking for desktop.

## Repo layout

- `specs/` — expectations (`E-*`), specs (`S-*`), test cases (`TC-*`), architecture
- `docs/` — developer guides, setup, testing strategy
- `project/` — project flow artifacts (PLAN.md, milestones, sprints)
- `product/` — implementation
  - `shared_types/` — cross-cutting Rust types (no logic)
  - `shared/` — CRUX core Rust crate (`cdylib` + `rlib`), WASM via `--features wasm`
  - `storage/` — Rust storage layer (async, filesystem + indexes)
  - `desktop-app/` — Tauri 2 + React + TypeScript + Vite (Rust crate under `src-tauri/`)
  - `web-app/` — React + TypeScript + Vite, imports shared core as WASM
  - `e2e-shared/` — shared E2E test scenarios/helpers (TypeScript)

## Commands

| `just` recipe | What it runs |
|---|---|
| `just build` | `cargo build --workspace` |
| `just test` | `cargo test --workspace` |
| `just lint` | `cargo clippy --workspace -- -D warnings` |
| `just fmt` / `just fmt-check` | `cargo fmt --all` / `-- --check` |
| `just ci` | `fmt-check -> lint -> test` (order matters) |
| `just dev-desktop` | `npm run tauri dev` in `product/desktop-app` |
| `just dev-web` | `npm run dev` in `product/web-app` |
| `just dev-backend` | `cargo run -p backend-service` (crate does not exist yet) |
| `just setup` | `npm install` in desktop-app + web-app |
| `just build-wasm` | `wasm-pack build product/shared --target web --out-dir ../web-app/src/wasm -- --features wasm` |
| `just e2e-desktop` | Tauri release build + `wdio` |
| `just e2e-web` | build-wasm + `wdio` (Vite dev auto-started by wdio) |
| `just e2e` | desktop + web |

For E2E iteration: `just e2e-web rebuild=false` skips WASM rebuild. `just e2e-desktop rebuild=false` skips Tauri build.

## CI (`.github/workflows/ci.yml`)

- **Rust job:** `cargo fmt --check` → `cargo clippy --workspace -- -D warnings` → `cargo build --workspace` → `cargo test --workspace`
- **Web job:** `npm install` → `npm run build` (which is `tsc -b && vite build`)
- System deps for Tauri: `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf`
- `RUSTFLAGS="-Dwarnings"` in CI

## Key conventions

- **Spec-driven**: expectations → specs → test cases. Codes: `E-*`, `S-*`, `TC-*`. Cross-reference with `@CODE` or `@(CODE1,CODE2)`. See `specs/testing.md` for test case index.
- **Folder-notes**: sibling `foo.md` + `foo/` directory. The file is the summary; the folder holds detail files (expectations, decisions, sub-items). Used in `specs/`, `project/`, and `docs/development/`.
- **Pre-commit hook** (`.githooks/pre-commit`): validates `project/` markdown links via Node.js. Requires `node` in PATH.
- **EditorConfig**: `.rs` = 4-space indent, `.ts/.tsx/.js/.json` = 2-space, `.toml` = 4-space
- **Rust**: edition 2021, workspace resolver "2"
- **Shared core** (`product/shared`): `crate-type = ["cdylib", "rlib"]`; WASM via wasm-bindgen behind `wasm` feature flag
- **`.env`** at repo root loaded automatically by `justfile` (`set dotenv-load`)
- **No backend-service Rust crate exists yet** — docker-compose has a placeholder but no `product/backend-service/` directory

## Testing quirks

- Rust unit tests: `#[cfg(test)]` inline modules. Integration: `tests/` with `tokio::test`, `tempfile::TempDir` for isolation.
- E2E via WebdriverIO (`wdio`): config at `product/{desktop-app,web-app}/tests/e2e/wdio.conf.ts`
- Prerequisites (one-time): `cargo install tauri-driver`, `sudo apt install webkit2gtk-driver`
- Vite dev: port 1420 for desktop (Tauri config), auto-managed for web E2E
- Kill stale processes between E2E runs: `pkill -f 'vite' ; pkill -f 'chromedriver'`

## Agents

- `.github/agents/` — 4 QA agents (SpecsQA, ImplementationQA, CodeQA, BehaviourQA — assert/detect, never implement) and 4 Dev agents (SpecsDev, ImplementationDev, CodeDev, BehaviourDev — fix issues reported by QA)
- `.github/skills/manage-project-flow-data/SKILL.md` — skill for creating/maintaining project plan artifacts

## Agent sandbox (VS Code)

- `just` recipes may fail in sandbox with `Read-only file system` at `/run/user/*/just`. Workaround: call underlying command directly (e.g., `cd product/web-app && npm run test:e2e`), or allow write in `.vscode/settings.json`: `"allowWrite": ["/run/user/*/just"]`
- E2E tests need unsandboxed execution (ChromeDriver/tauri-driver spawn processes blocked by seccomp)
