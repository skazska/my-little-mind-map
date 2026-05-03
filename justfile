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
    cd product/desktop-app && npm run dev

# Build desktop app
build-desktop:
    cd product/desktop-app && npm run build

# === Web ===

# Run web app in dev mode
dev-web:
    cd product/web-app && npm run dev

# Build web app
build-web:
    cd product/web-app && npm run build

# === Setup ===

# Install all JS dependencies
install-js:
    cd product/desktop-app && npm install
    cd product/web-app && npm install

# Full setup: install all deps
setup: install-js
    @echo "Setup complete!"
