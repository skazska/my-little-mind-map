---
name: 'Rust Code'
description: 'Coding conventions for Rust code in this project.'
applyTo: '**/*.rs'
---
# Rust Coding Standards

- **Format:** `cargo fmt` (enforced in CI)
- **Lint:** `cargo clippy` with `-D warnings` (enforced in CI)
- **Edition:** 2024 (set in workspace `Cargo.toml`)
- **Dependencies:** add shared deps to `[workspace.dependencies]`, reference with `.workspace = true`
