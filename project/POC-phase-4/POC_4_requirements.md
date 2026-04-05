# Phase 4 Requirements — Linking

> Phase scope: Bidirectional links between notes and topics with backlinks display and inline reference sync.

References: [POC-requirements.md](POC-requirements.md), [POC-decisions.md](POC-decisions.md)

---

## Applicable Requirements

### From POC Requirements

| Requirement | Relevance |
|-------------|-----------|
| FR-D6.1–D6.7 | Bidirectional linking |
| D-009 | Reference index sync — text ↔ index bidirectional |
| D-010 | Text-centered: references in text are source of truth |
| NFR-4.1 | Reference index stays in sync with note content |
| NFR-4.3 | Broken references detected and surfaced |

### Phase-Specific Requirements

| ID | Requirement | Traces to |
|----|-------------|-----------|
| P4-R1 | Link creation UI: user can link current note to another note | FR-D6.1 |
| P4-R2 | Link creation UI: user can link current note to a topic | FR-D6.2 |
| P4-R3 | All links are stored bidirectionally in reference index | FR-D6.3, D-009 |
| P4-R4 | Link creation inserts `[[note-id\|text]]` in note content | FR-D6.6, D-009 |
| P4-R5 | Backlinks panel: shows all notes linking to current note | FR-D6.5, UC-8 |
| P4-R6 | Backlinks show surrounding context text | UC-8 |
| P4-R7 | On note delete: references in other notes marked as broken | FR-D6.7, NFR-4.3 |
| P4-R8 | Inline reference autocomplete: typing `[[` triggers note search | FR-D6.6, UC-7 |
| P4-R9 | On save: AST parsed, references extracted, index updated | D-009, NFR-4.1 |
| P4-R10 | On index change (e.g., target deleted): referencing note AST updated | D-009 |
| P4-R11 | Reference properties include `type` (links-to, embeds) and `isOriginal` | D-002 |

---

## Acceptance Criteria

- [ ] User can link note A to note B via inline `[[...]]` syntax
- [ ] Link appears bidirectionally in the reference index
- [ ] Backlinks panel on note B shows note A with context
- [ ] Typing `[[` in editor triggers autocomplete with note titles
- [ ] Deleting a note marks its references in other notes as broken
- [ ] Broken references are visually indicated in the editor
- [ ] Note content references and reference index are in sync after every save
