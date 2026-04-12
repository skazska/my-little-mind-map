# Setup

```bash
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

## Quick verification

```bash
just ci          # fmt-check + clippy + test (all Rust crates)
just build       # cargo build --workspace
just dev-backend # start backend on http://localhost:3000
```

---
