# Task 3.1 — File Upload → Artifact

> Implement file upload to attach files (images, documents) as artifacts to a note.

| | |
|---|---|
| **Phase** | [Phase 3: Desktop App — Collect](../POC-phase-3-status.md) |
| **Requirements** | P3-R1 through P3-R5, P3-R14, FR-D2.1–D2.5 |
| **Decisions** | D-002 (assets in note folder), D-008 (source_type: uploaded), D-009 (index sync), D-010 (must be referenced) |
| **Depends on** | Phase 2 (2.2) |
| **Blocks** | 3.4 |
| **Status** | Not started |

---

## Goal

Allow users to upload files from the filesystem and attach them as artifacts to the current note.

## Scope

### Flow

1. User clicks "Upload" button (or drags file) in the note editor
2. Tauri file dialog opens (or drag-drop handler triggers)
3. Selected file(s) copied to `notes/{note-id}/assets/{filename}`
4. Asset metadata created (id, filename, mime_type, size_bytes, source_type: uploaded)
5. Reference inserted into note content: `![filename](assets/filename)` for images, `[filename](assets/filename)` for other files
6. Note meta.json updated with asset entry
7. Reference index updated

### Supported Formats (P3-R5)

| Format | MIME type | Preview |
|--------|----------|---------|
| PNG | image/png | Inline |
| JPEG | image/jpeg | Inline |
| GIF | image/gif | Inline |
| WebP | image/webp | Inline |
| PDF | application/pdf | Link |
| Plain text | text/plain | Link |

### Changes

- `desktop-app/src/components/NoteEditor.tsx` — add upload button, drag-drop zone
- `desktop-app/src-tauri/src/lib.rs` — Tauri command for file upload (uses `tauri::api::dialog` or `tauri-plugin-dialog`)
- CRUX: `UploadAsset { note_id, file_path }` event
- Storage library: `save_asset()` call

### MIME Detection

Use file extension for POC. Consider `infer` crate or `mime_guess` for more robust detection.

## Tests

- [ ] Upload an image → saved to assets/ folder
- [ ] Upload a PDF → saved to assets/ folder
- [ ] Reference inserted in note content
- [ ] Asset metadata in meta.json is correct
- [ ] Reference index updated
- [ ] Unsupported format: handled gracefully (still saved, just no preview)

## Acceptance Criteria

- [ ] User can upload files via dialog or drag-drop
- [ ] Files saved in correct location (D-002)
- [ ] Reference auto-inserted in note content (D-010)
- [ ] Metadata includes source_type: uploaded (D-008)
- [ ] Reference index updated (D-009)
