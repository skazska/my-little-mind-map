# Task 2.1 — Markdown Editor with AST Support

> Implement a markdown editor component in the React frontend that produces structured AST.

| | |
|---|---|
| **Phase** | [Phase 2: Desktop App — Write & Classify](../POC-phase-2-status.md) |
| **Requirements** | P2-R1, P2-R2, P2-R3, P2-R11, FR-D1.2, FR-D1.4, FR-D1.5 |
| **Decisions** | D-005 (structured AST, mdast preferred) |
| **Depends on** | Phase 1 |
| **Blocks** | 2.2, Phase 4 (4.4), Phase 6 (6.2) |
| **Status** | Not started |

---

## Goal

Build a markdown editor React component for the desktop app that supports basic markdown formatting and outputs structured AST. Includes a spike to evaluate mdast cross-platform compatibility.

## Scope

### Spike: mdast Cross-Platform Evaluation (P2-R11)

Before building the editor, validate D-005:

1. **Rust side:** Evaluate `markdown-rs` / `pulldown-cmark` / `comrak` for mdast-compatible AST output
2. **JS side:** Evaluate `remark` / `unified` ecosystem for mdast parsing/rendering
3. **Compatibility:** Can Rust and JS produce/consume the same AST structure?
4. **Round-trip:** markdown → AST → markdown fidelity
5. **Extensibility:** Can we add custom node types (e.g., `[[internal-ref]]`)?

**Spike output:** Decision document in this task folder:

- `project/POC-phase-2/2.1_markdown-editor-ast/mdast-evaluation.md`

### Editor Component

- New file: `desktop-app/src/components/MarkdownEditor.tsx`
- Dependencies: TBD based on spike (likely `@uiw/react-md-editor`, `react-markdown`, or custom with `unified`/`remark`)

### Features (POC baseline)

| Feature | Markdown syntax | Required |
|---------|----------------|----------|
| Headings | `# ## ###` | Yes |
| Bold | `**text**` | Yes |
| Italic | `*text*` | Yes |
| Lists (ordered/unordered) | `- item` / `1. item` | Yes |
| Code blocks | `` ``` `` | Yes |
| Links | `[text](url)` | Yes |
| Images | `![alt](path)` | Yes |
| Internal references | `[[note-id\|text]]` | Yes (P2-R3) |
| Tables | `\| col \|` | Nice to have |
| Blockquotes | `> text` | Nice to have |

### Editor Modes

1. **Edit mode:** WYSIWYG-ish or split-pane (markdown source + preview)
2. **View mode:** Rendered markdown
3. For POC: split-pane (source + preview) is acceptable

### AST Integration

- On content change: parse markdown to AST
- On save: send AST + raw markdown to CRUX core
- AST stored alongside raw markdown for round-trip fidelity

## Deliverables

1. Spike evaluation document
2. `MarkdownEditor` React component
3. AST parsing integration (JS-side)

## Tests

- [ ] Editor renders and accepts text input
- [ ] Basic markdown formats correctly in preview
- [ ] Internal reference syntax `[[...]]` is parsed
- [ ] AST output matches expected structure
- [ ] Round-trip: type markdown → get AST → render back to markdown → same content

## Acceptance Criteria

- [ ] mdast evaluation spike completed and documented
- [ ] Editor component renders in desktop app
- [ ] All required markdown features work
- [ ] Internal reference syntax supported
- [ ] Editor outputs structured AST
- [ ] AST is compatible between Rust and JS (or fallback documented)
