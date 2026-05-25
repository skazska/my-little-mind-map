# Testing

Test-cases to be stored in `docs/testing/` as markdown files, organized by feature or user flow.

## Expectations

1. auto-tests pyramid: unit-tests for reusable or un protected by types logic, integration and E2E for user flows and critical features.
2. specification-driven testing: tests reflect defined specifications.
3. tests as living documentation: tests should be clear and descriptive, serving as documentation for expected behavior and edge cases.
4. test coverage: spec coverage, purpose coverage, functionality coverage, edge case coverage.
5. test case documentation first: write test cases based on specs before test implementation.
6. test first: implement tests then code.
7. testing tools and infrastructure allow AI agents perform UI testing.

## Infrastructure

### Tooling by layer

| Layer | Scope | Tools |
|-------|-------|-------|
| **Unit** | Pure functions, type validation, data transformations | `cargo test` with `#[cfg(test)]` inline modules |
| **Integration** | Storage I/O, index sync, filesystem layout | `cargo test` with `tests/` crates, `tokio::test` for async, `tempfile::TempDir` for isolation |
| **E2E** | Full user flows through the UI | `tauri-driver` + WebdriverIO (`wdio`); Tauri's official WebDriver approach |
| **Static analysis** | Code quality, style | `cargo clippy`, `cargo fmt --check`, `eslint`, `tsc --noEmit` |

### Running tests

```sh
# Unit + integration (Rust)
cargo test

# E2E (requires tauri-driver on PATH, app built in debug mode)
just e2e        # or: npx wdio run wdio.conf.ts

# Static analysis
cargo clippy --all-targets --all-features
cargo fmt --check
cd product/desktop-app && npx eslint src
```

### AI agent UI testing

Tauri WebDriver exposes the app window via WebDriver protocol. AI agents can interact via standard WebDriver commands (click, type, read elements). Sessions are started with `tauri-driver` as the driver binary. Test files in `product/desktop-app/tests/e2e/` use WebdriverIO with TypeScript.

---

## QA Strategy

### Test pyramid

```
         /‾‾‾‾‾‾‾‾‾‾‾\
        /    E2E      \      User flows — slow, high confidence
       /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
      /   Integration   \    Storage I/O, index sync — medium speed
     /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
    /       Unit          \  Types, logic, parsing — fast, exhaustive
   /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
```

- **Unit tests** cover: ID validation, label validation, front matter parse/serialize, `update()` + `view()` logic, content command parsing, search and filter algorithms.
- **Integration tests** cover: storage CRUD, filesystem layout correctness, index sync on create/update/delete, error propagation across layers.
- **E2E tests** cover: first launch, space management, full note lifecycle, autosave, search and filtering, navigation.

### Coverage expectations

| Dimension | Expectation |
|-----------|-------------|
| Spec coverage | Every spec ID has at least one test case |
| Purpose coverage | Each function/operation has a happy-path case |
| Functionality coverage | All branches of conditional logic tested |
| Edge case coverage | Invalid input, missing files, concurrent ops, encoding edge cases |

### e2e testing unification

Each platform's E2E tests should cover the same user flows and scenarios, ensuring consistent behavior across platforms.

It is reasonable to:

- have reusable test scenarios defined in a platform-agnostic way.
- have reusable code for test implementation across platforms, with platform-specific details abstracted away.

### Test case files

| File | Layer | Covers |
|------|-------|--------|
| [testing/data-model.md](testing/data-model.md) | Unit | Types, IDs, labels, frontmatter |
| [testing/storage.md](testing/storage.md) | Integration | Storage CRUD, filesystem layout, indexes |
| [testing/app-logic.md](testing/app-logic.md) | Unit / Integration | Shared core: `update()`, `view()`, effects |
| [testing/user-flows.md](testing/user-flows.md) | E2E | Full user flows via Tauri WebDriver |
