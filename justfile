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
    cd desktop-app && pnpm tauri dev

# Build desktop app
build-desktop:
    cd desktop-app && pnpm tauri build

# === Web ===

# Run web app in dev mode
dev-web:
    cd web-app && pnpm dev

# Build web app
build-web:
    cd web-app && pnpm build

# === Setup ===

# Install all JS dependencies
install-js:
    cd desktop-app && pnpm install
    cd web-app && pnpm install

# Full setup: install all deps
setup: install-js
    @echo "Setup complete!"
