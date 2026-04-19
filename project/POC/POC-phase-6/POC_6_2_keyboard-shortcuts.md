# Task 6.2 — Keyboard Shortcuts

> Implement keyboard shortcuts for common actions.

| | |
|---|---|
| **Phase** | [Phase 6: Polish & Release](../POC-phase-6-status.md) |
| **Requirements** | P6-R4, P6-R5 |
| **Decisions** | — |
| **Depends on** | Phase 2 (2.1) |
| **Blocks** | — |
| **Status** | Cancelled |

---

## Goal

Add keyboard shortcuts for frequently used actions to improve productivity.

## Scope

### Shortcuts

| Action | Shortcut | Context |
|--------|----------|---------|
| New note | `Ctrl+N` | Global |
| Save note | `Ctrl+S` | Note editor |
| Search notes | `Ctrl+K` or `Ctrl+/` | Global |
| Sync | `Ctrl+Shift+S` | Global |
| Bold | `Ctrl+B` | Note editor |
| Italic | `Ctrl+I` | Note editor |
| Insert link | `Ctrl+L` | Note editor |
| Insert internal ref | `Ctrl+Shift+L` | Note editor |
| Toggle topic sidebar | `Ctrl+T` | Global |

### Implementation

- Tauri: use `tauri::GlobalShortcut` for app-wide shortcuts
- React: use `useEffect` with `keydown` listeners for view-specific shortcuts
- Editor shortcuts: handled by the markdown editor component

### Discoverability (P6-R5)

- Help dialog (`Ctrl+?` or `F1`): list all shortcuts
- Tooltips on buttons show shortcut hint

### Changes

- `desktop-app/src-tauri/src/lib.rs` — register global shortcuts
- `desktop-app/src/hooks/useShortcuts.ts` — React keyboard hook
- `desktop-app/src/components/ShortcutsHelp.tsx` — help dialog

## Tests

- [ ] Each shortcut triggers correct action
- [ ] Shortcuts don't conflict with OS defaults
- [ ] Help dialog shows all shortcuts
- [ ] Shortcuts work in correct context (global vs editor)

## Acceptance Criteria

- [ ] Core shortcuts implemented (new, save, search, sync)
- [ ] Editor formatting shortcuts work
- [ ] Shortcuts documented and discoverable via help dialog
