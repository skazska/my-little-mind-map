# my-little-mind-map task orchestration

set dotenv-load

# Default: list available recipes
default:
    @just --list

# === Workspace-wide ===

# Build all Rust crates
build:
    cargo build --workspace

# Run all Rust tests
test:
    cargo test --workspace

# Lint all Rust code
lint:
    cargo clippy --workspace -- -D warnings

# Format all Rust code
fmt:
    cargo fmt --all

# Check formatting without modifying
fmt-check:
    cargo fmt --all -- --check

# Full CI check: fmt, lint, test
ci: fmt-check lint test

# === Backend ===

# Run backend service in dev mode
dev-backend:
    cargo run -p backend-service

# === Desktop ===

# Run desktop app in dev mode
dev-desktop:
    cd product/desktop-app && npm run tauri dev

# Build desktop app for distribution
build-desktop:
    cd product/desktop-app && npm run tauri build

# === Web ===

# Run web app in dev mode
dev-web:
    cd product/web-app && npm run dev

# Build web app
build-web:
    cd product/web-app && npm run build

# Build WASM package from shared core
build-wasm:
    wasm-pack build product/shared --target web --out-dir ../web-app/src/wasm -- --features wasm

# === Setup ===

# Install all JS dependencies
install-js:
    cd product/desktop-app && npm install
    cd product/web-app && npm install

# Full setup: install all deps
setup: install-js
    @echo "Setup complete!"

# Run E2E tests via WebdriverIO against the Tauri desktop app.
#
# Prerequisites (one-time setup):
#   cargo install tauri-driver           # WebDriver bridge for Tauri
#   sudo apt install webkit2gtk-driver   # provides /usr/bin/WebKitWebDriver (Linux only)
#
# By default a full release build runs first.  Pass rebuild=false to skip the
# Tauri build when the binary is already up to date — useful during iterative
# test development to avoid waiting for a full release compile each run.
#
#   just e2e-desktop              # build + test  (safe, always correct)
#   just e2e-desktop rebuild=false  # test only   (fast, assumes binary is current)
e2e-desktop rebuild="true":
    #!/usr/bin/env bash
    set -e
    if [[ "{{rebuild}}" == "true" ]]; then
        (cd product/desktop-app && npm run tauri build)
    fi
    (cd product/desktop-app && npm run test:e2e)

# Run E2E tests for the web app via WebdriverIO + Chrome.
#
# A Vite dev server is spawned automatically by wdio.conf.ts before the tests
# run and torn down when they finish; you do NOT need to start it manually.
#
# By default, the WASM package is rebuilt first to ensure the web app picks up
# any Rust core changes.  Pass rebuild=false to skip this when iterating on
# tests or UI only.
#
#   just e2e-web              # build wasm + test  (safe, always correct)
#   just e2e-web rebuild=false  # test only          (fast, skips wasm build)
e2e-web rebuild="true":
    #!/usr/bin/env bash
    set -e
    if [[ "{{rebuild}}" == "true" ]]; then
        just build-wasm
    fi
    cd product/web-app && npm run test:e2e

# Run E2E tests for all platforms (desktop + web).
#
# Builds both the Tauri desktop app and the WASM package before testing.
# Pass rebuild=false to skip builds when the binaries are already up to date.
#
#   just e2e               # build all + test all  (safe, always correct)
#   just e2e rebuild=false   # test all              (fast, skips builds)
e2e rebuild="true":
    just e2e-desktop rebuild={{rebuild}}
    just e2e-web rebuild={{rebuild}}
