# Task 3.4 — File/Media Preview in Editor

> Implement inline previews for images and file links in the note editor.

| | |
|---|---|
| **Phase** | [Phase 3: Desktop App — Collect](../POC-phase-3-status.md) |
| **Requirements** | P3-R15 |
| **Decisions** | D-002 (asset location), D-005 (AST — asset nodes in AST) |
| **Depends on** | 3.1 |
| **Blocks** | — |
| **Status** | Not started |

---

## Goal

Render uploaded/pasted/captured assets inline in the note editor and preview pane.

## Scope

### Image Preview

- Image embeds (`![alt](assets/filename.png)`) render as inline images
- Images loaded from the note's `assets/` folder via Tauri asset protocol or file:// URL
- Tauri asset protocol: `asset://localhost/{path}` or `tauri://localhost/{path}`

### Non-Image Files

- File links (`[filename](assets/filename.pdf)`) render as clickable links with file icon
- Click opens file in system default application
- Show file size and type in tooltip

### Changes

- `desktop-app/src/components/MarkdownEditor.tsx` — custom renderers for images and file links
- Tauri configuration: configure asset protocol to serve local files
- `desktop-app/src-tauri/tauri.conf.json` — security scope for file access

### Considerations

- Image sizing: max-width constraint to prevent layout issues
- Loading state: placeholder while image loads
- Missing asset: show broken image indicator (connects to NFR-4.3)

## Tests

- [ ] Uploaded image renders inline in preview
- [ ] Pasted image renders inline
- [ ] Captured image renders inline
- [ ] PDF file shows as clickable link
- [ ] Click on file link opens in system viewer
- [ ] Missing asset shows broken indicator

## Acceptance Criteria

- [ ] Images render inline in the note editor/preview
- [ ] Non-image files show as clickable file links
- [ ] Broken/missing assets indicated visually
- [ ] No security issues with file access (Tauri security scope configured)
