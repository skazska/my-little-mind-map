# Phase 2 Requirements — Desktop App: Write & Classify

> Phase scope: Build the core writing and classification experience in the desktop app.

References: [POC-requirements.md](POC-requirements.md), [POC-decisions.md](POC-decisions.md)

---

## Applicable Requirements

### From POC Requirements

| Requirement | Relevance |
|-------------|-----------|
| FR-D1.1–D1.7 | Write: create/edit notes, markdown editor, AST storage |
| FR-D5.1–D5.7 | Classify: topics, classification, typed relations |
| NFR-2.1–2.2 | Text-centered UI flows |
| NFR-4.2 | Classification constraint enforced at core |
| D-005 | Structured AST (mdast evaluation) |
| D-009 | Reference index sync on save |
| D-010 | Text-centered design |
| D-011 | Classification required |

### Phase-Specific Requirements

| ID | Requirement | Traces to |
|----|-------------|-----------|
| P2-R1 | Markdown editor component renders in React frontend | FR-D1.2, FR-D1.4 |
| P2-R2 | Editor produces structured AST (mdast preferred) | FR-D1.3, D-005 |
| P2-R3 | Editor supports internal reference syntax `[[note-id\|text]]` | FR-D1.5, FR-D6.6 |
| P2-R4 | Create note flow: editor → CRUX event → storage write | FR-D1.1, NFR-3.1 |
| P2-R5 | Save triggers AST parsing and reference index update | D-009, NFR-4.1 |
| P2-R6 | Note creation requires topic selection (≥1 topic) | FR-D5.3, D-011 |
| P2-R7 | Topic CRUD: create, rename, list topics | FR-D5.1, UC-12 |
| P2-R8 | Topic relation management: create typed relations between topics | FR-D5.5, D-004 |
| P2-R9 | Note list/browse view with title, topics, dates | UC-11 |
| P2-R10 | Topic filter/browse view: select topic → see classified notes | FR-D5.7, UC-11 |
| P2-R11 | mdast cross-platform spike: validate Rust + JS compatibility | D-005 |

---

## Acceptance Criteria

- [ ] User can create a new note with markdown content in the desktop app
- [ ] Note content is stored as structured AST in the local filesystem
- [ ] User can edit an existing note
- [ ] User must select ≥1 topic before saving a note (enforced)
- [ ] User can create, rename, and list topics
- [ ] User can create typed relations between topics
- [ ] Note list view shows all notes with title, topics, and dates
- [ ] Topic browser filters notes by selected topic
- [ ] mdast evaluation completed: decision on mdast vs custom AST documented
