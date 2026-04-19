# Task 6.3 — App Settings

> Implement configurable app settings for backend URL, sync interval, and data directory.

| | |
|---|---|
| **Phase** | [Phase 6: Polish & Release](../POC-phase-6-status.md) |
| **Requirements** | P6-R6, P6-R7 |
| **Decisions** | D-002 (data directory), D-006 (sync configuration) |
| **Depends on** | Phase 5 (5.2) |
| **Blocks** | — |
| **Status** | Cancelled |

---

## Goal

Allow users to configure key app settings that persist locally.

## Scope

### Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Backend URL | string | `http://localhost:3000` | Backend service address |
| Sync interval | integer (seconds) | 300 (5 min) | Auto-sync interval (0 = manual only) |
| Data directory | path | `{app_data_dir}/data` | Where local data is stored |
| Auto-sync | boolean | true | Enable/disable automatic sync |

### Storage

Settings stored in `{app_data_dir}/settings.json` (separate from data storage).

### UI

- `desktop-app/src/components/SettingsView.tsx` — settings form
- Accessible via menu or keyboard shortcut
- Changes take effect immediately (backend URL on next sync, data dir on restart)

### Changes

- `desktop-app/src-tauri/src/lib.rs` — Tauri commands for reading/writing settings
- `shared/src/app.rs` — settings-related events if needed
- Settings propagated to storage initialization and sync HTTP calls

## Tests

- [ ] Settings save and persist across app restarts
- [ ] Backend URL change affects sync calls
- [ ] Invalid URL shows validation error
- [ ] Data directory change requires restart (with notification)

## Acceptance Criteria

- [ ] User can configure backend URL, sync interval, data directory
- [ ] Settings persist locally
- [ ] Changes take effect appropriately
