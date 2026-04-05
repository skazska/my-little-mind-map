# Tests

## Strategy

### Unit Tests

- Rust: `cargo test` in each crate — especially the shared core
- TypeScript: Vitest for web-app and desktop-app frontend

### Integration Tests

- Backend API: integration tests against Axum handlers (in `backend-service/tests/`)
- CRUX core: full event → effect → view cycle tests (in `shared/src/app.rs`)

### E2E Tests

- Desktop: Tauri's WebDriver-based testing (future)
- Web: Playwright or Cypress (future)
- Mobile: XCUITest (iOS), Espresso (Android) (future)

## Running Tests

```bash
# All Rust tests
just test

# Specific crate
cargo test -p shared
cargo test -p backend-service
```
