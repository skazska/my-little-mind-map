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

