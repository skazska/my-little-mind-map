# Task 6.1 — Error Handling and User Feedback

> Implement comprehensive error handling with user-friendly feedback.

| | |
|---|---|
| **Phase** | [Phase 6: Polish & Release](../POC-phase-6-status.md) |
| **Requirements** | P6-R1, P6-R2, P6-R3 |
| **Decisions** | — |
| **Depends on** | All prior phases |
| **Blocks** | 6.4, 6.5 |
| **Status** | Not started |

---

## Goal

Replace raw error messages with user-friendly feedback. Handle all error categories gracefully.

## Scope

### Error Categories

| Category | Examples | Handling |
|----------|----------|----------|
| Storage | Disk full, permission denied, corrupt file | Show error, suggest fix (free space, check permissions) |
| Network | Timeout, connection refused, DNS failure | Show offline indicator, queue for retry |
| Validation | Missing topic, empty title, invalid reference | Show inline validation message near the field |
| Data integrity | Broken reference, orphaned asset | Show warning, offer fix (remove broken ref, delete orphan) |
| Unexpected | Panic, unhandled error | Log, show generic "Something went wrong" with option to report |

### CRUX Error Handling

- CRUX `update()` returns `Command` — errors become events (e.g., `ErrorOccurred { category, message }`)
- ViewModel includes error state for current view
- Shell-level errors (Tauri commands failing) caught and converted to events

### React Error UI

- `components/ErrorBanner.tsx` — top-of-page error banner for global errors
- `components/Toast.tsx` — transient notification for non-blocking errors
- Inline validation messages on forms (note editor, topic editor)

### Changes

- `shared/src/app.rs` — error event variants, error state in ViewModel
- `desktop-app/src/components/` — error display components
- All existing handlers: add proper error propagation (no unwrap in production paths)

## Tests

- [ ] Storage error → user sees friendly message
- [ ] Network error → offline indicator, no crash
- [ ] Validation error → inline message
- [ ] Unexpected error → generic message + log

## Acceptance Criteria

- [ ] No raw error messages or stack traces visible to user (P6-R1)
- [ ] Network errors handled gracefully (P6-R2)
- [ ] Storage errors handled gracefully (P6-R3)
- [ ] Validation errors shown inline
