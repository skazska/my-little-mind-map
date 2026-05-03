# Setup

```bash
# Rust toolchain is auto-installed via rust-toolchain.toml on first cargo command.
# Verify:
rustc --version
cargo --version

# Install just (task runner)
cargo install just

# Install all JS deps
just setup

# Enable repository git hooks
git config core.hooksPath .githooks

# Verify everything builds
just build
```

## Repository hooks

This repository uses committed git hooks from `.githooks/`.

- Native git commits use `.githooks/pre-commit`.
- Copilot hook validation uses `.github/hooks/validate-project-links-before-commit.json`.
- Node.js is required for the shared Markdown link validator used by both hook paths.

If hooks are not active locally, run:

```bash
git config core.hooksPath .githooks
```

## Quick verification

```bash
just ci          # fmt-check + clippy + test (all Rust crates)
just build       # cargo build --workspace
just dev-backend # start backend on http://localhost:3000
```

---
