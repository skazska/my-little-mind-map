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
