# Phase 3 Requirements — Desktop App: Collect (Upload, Paste, Capture)

> Phase scope: Add more ways to collect artifacts into notes: file upload, clipboard paste, screen capture.

References: [POC-requirements.md](POC-requirements.md), [POC-decisions.md](POC-decisions.md)

---

## Applicable Requirements

### From POC Requirements

| Requirement | Relevance |
|-------------|-----------|
| FR-D2.1–D2.5 | Upload files as artifacts |
| FR-D3.1–D3.5 | Paste from clipboard |
| FR-D4.1–D4.4 | Screen region capture |
| D-002 | Assets stored in note's `assets/` folder |
| D-008 | `source_type` metadata (uploaded, pasted, captured) |
| D-009 | Reference index sync after adding assets |
| D-010 | All non-text artifacts must be referenced from a note |
| D-013 | Screen capture implementation approach |

### Phase-Specific Requirements

| ID | Requirement | Traces to |
|----|-------------|-----------|
| P3-R1 | File upload dialog: user selects file(s) to attach to current note | FR-D2.1 |
| P3-R2 | Uploaded files stored in `notes/{note-id}/assets/` | FR-D2.2, D-002 |
| P3-R3 | Upload inserts reference in note content (image embed or file link) | FR-D2.3, D-010 |
| P3-R4 | Upload sets `source_type: uploaded` on asset metadata | FR-D2.4, D-008 |
| P3-R5 | Minimum supported upload formats: PNG, JPEG, GIF, WebP, PDF, plain text | FR-D2.5 |
| P3-R6 | Clipboard paste detects content type (text vs image) | FR-D3.1, FR-D3.2 |
| P3-R7 | Pasted images saved to `assets/` folder | FR-D3.3, D-002 |
| P3-R8 | Paste inserts reference at cursor position | FR-D3.4, D-010 |
| P3-R9 | Paste sets `source_type: pasted` | FR-D3.5, D-008 |
| P3-R10 | Screen capture: user can select a screen region | FR-D4.1 |
| P3-R11 | Captured image saved to `assets/` folder | FR-D4.2, D-002 |
| P3-R12 | Capture inserts image embed in note | FR-D4.3, D-010 |
| P3-R13 | Capture sets `source_type: captured` | FR-D4.4, D-008 |
| P3-R14 | After any asset add, reference index is updated | D-009 |
| P3-R15 | File/media preview: images render inline, other files show icon/name | UC-2 |

---

## Acceptance Criteria

- [ ] User can upload an image file and see it embedded in the note
- [ ] User can upload a PDF and see a file link in the note
- [ ] User can paste an image from clipboard into a note
- [ ] User can paste text from clipboard into a note
- [ ] User can capture a screen region and see it embedded in the current note
- [ ] All uploaded/pasted/captured assets appear in the note's `assets/` folder
- [ ] `source_type` metadata is correctly set for each collection method
- [ ] Reference index is updated after each asset operation
- [ ] Images render inline in the note editor/preview
