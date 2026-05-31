# Test Cases

Test-cases are stored in `specs/testing/` as markdown files, organized by feature or user flow.

See [docs/testing.md](../docs/testing.md) for test strategy, tooling, and infrastructure.

## Test case files

| File | Layer | Covers |
|------|-------|--------|
| [testing/data-model.md](testing/data-model.md) | Unit | Types, IDs, labels, frontmatter |
| [testing/storage.md](testing/storage.md) | Integration | Storage CRUD, filesystem layout, indexes |
| [testing/app-logic.md](testing/app-logic.md) | Unit / Integration | Shared core: `update()`, `view()`, effects |
| [testing/user-flows.md](testing/user-flows.md) | E2E | Full user flows via Tauri WebDriver |
