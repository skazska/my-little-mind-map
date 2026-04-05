# Task 3.3 — Screen Region Capture → Artifact

> Implement screen region capture to create image artifacts attached to the current note.

| | |
|---|---|
| **Phase** | [Phase 3: Desktop App — Collect](../POC-phase-3-status.md) |
| **Requirements** | P3-R10 through P3-R14, FR-D4.1–D4.4 |
| **Decisions** | D-002 (assets folder), D-008 (source_type: captured), D-009 (index sync), D-010 (must be referenced), D-013 (capture implementation) |
| **Depends on** | Phase 2 (2.2) |
| **Blocks** | — |
| **Status** | Not started |

---

## Goal

Allow users to capture a selected region of the screen and save it as an image artifact in the current note.

## Scope

### Flow

1. User clicks "Capture Screen" button in note editor
2. App window minimizes/hides
3. Screen overlay/selection tool appears
4. User selects a rectangular region
5. Region captured as PNG image
6. App window restores
7. Image saved to `notes/{note-id}/assets/capture-{timestamp}.png`
8. Asset metadata created with `source_type: captured`
9. Image embed inserted in note: `![screen capture](assets/capture-{timestamp}.png)`
10. Reference index updated

### Implementation Options (D-013)

Evaluate in priority order:

1. **Tauri plugin:** Check for screenshot/capture plugins in Tauri v2 ecosystem
2. **`screenshots` Rust crate:** Cross-platform screen capture. May need separate region selection UI
3. **OS-native tools:** Invoke `gnome-screenshot -a`, `macos screencapture -i`, `snippingtool` — platform-specific but reliable
4. **Hybrid:** Rust crate for capture + custom overlay window in Tauri for region selection

### Changes

- `desktop-app/src-tauri/Cargo.toml` — add screenshot dependency
- `desktop-app/src-tauri/src/lib.rs` — Tauri commands for capture
- `desktop-app/src/components/NoteEditor.tsx` — capture button
- CRUX: `CaptureScreen { note_id }` event
- May need Tauri permissions for screen access

### Platform-Specific Notes

- **Linux:** X11/Wayland differences. `gnome-screenshot -a` works on GNOME. Wayland may need portal API
- **macOS:** `screencapture -i` for interactive selection
- **Windows:** `snippingtool` or Win32 API

For POC: implement Linux first (primary dev platform), stub others.

## Tests

- [ ] Capture button triggers screen selection
- [ ] Selected region saved as PNG
- [ ] Asset metadata correct (source_type: captured)
- [ ] Image embed inserted in note
- [ ] Reference index updated
- [ ] App window hides/restores correctly

## Acceptance Criteria

- [ ] User can capture a screen region
- [ ] Captured image saved as artifact (D-002)
- [ ] source_type: captured set correctly (D-008)
- [ ] Reference auto-inserted (D-010)
- [ ] Works on Linux (primary target for POC)
