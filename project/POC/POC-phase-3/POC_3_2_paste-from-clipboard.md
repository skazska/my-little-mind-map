# Task 3.2 — Paste from Clipboard → Artifact

> Implement clipboard paste support for text and images in the note editor.

| | |
|---|---|
| **Phase** | [Phase 3: Desktop App — Collect](../POC-phase-3-status.md) |
| **Requirements** | P3-R6 through P3-R9, P3-R14, FR-D3.1–D3.5 |
| **Decisions** | D-002 (assets folder), D-008 (source_type: pasted), D-009 (index sync), D-010 (must be referenced) |
| **Depends on** | Phase 2 (2.2) |
| **Blocks** | — |
| **Status** | Not started |

---

## Goal

Enable pasting text and images from the system clipboard directly into a note.

## Scope

### Text Paste

Standard browser/webview paste behavior — text pastes into the markdown editor at cursor position. No special handling needed beyond the editor component.

### Image Paste

1. User copies image to clipboard (e.g., screenshot, web image)
2. User presses Ctrl+V in the note editor
3. JS detects clipboard contains image data (via `ClipboardEvent.clipboardData`)
4. Image binary extracted from clipboard
5. Sent to Tauri backend via invoke
6. Saved to `notes/{note-id}/assets/paste-{timestamp}.png`
7. Asset metadata created with `source_type: pasted`
8. Image embed inserted at cursor: `![pasted image](assets/paste-{timestamp}.png)`
9. Reference index updated

### Changes

- `desktop-app/src/components/MarkdownEditor.tsx` — clipboard paste handler
- `desktop-app/src-tauri/src/lib.rs` — Tauri command to save pasted image
- CRUX: `PasteAsset { note_id, data, mime_type }` event
- Storage: `save_asset()` call

### Platform Considerations

- Tauri webview supports clipboard API
- For image clipboard: read as `Blob` from `ClipboardItem`, convert to `Uint8Array`, send via Tauri invoke
- Alternative: use `tauri-plugin-clipboard-manager` for native clipboard access

## Tests

- [ ] Paste text → inserted at cursor position
- [ ] Paste image → saved as asset, embed inserted
- [ ] Pasted image has correct metadata (source_type: pasted)
- [ ] Reference index updated after paste
- [ ] Paste non-image non-text → handled gracefully

## Acceptance Criteria

- [ ] Text paste works in editor
- [ ] Image paste creates asset file and inserts reference
- [ ] source_type: pasted set correctly (D-008)
- [ ] Reference index updated (D-009)
