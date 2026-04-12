# mdast Cross-Platform Evaluation — Spike Results

> Task 2.1 spike (P2-R11, D-005): Validate mdast cross-platform compatibility between Rust and JS.

---

## Parsers Evaluated

### Rust

| Crate | Version | mdast output | Serde support | Notes |
|-------|---------|-------------|---------------|-------|
| `markdown` (formerly `markdown-rs`) | 1.0 | Native mdast AST via `to_mdast()` | No `Serialize`/`Deserialize` on `Node` | Best mdast fidelity; position info; GFM support |
| `pulldown-cmark` | 0.13 | Event-based (no AST) | N/A | Would require building AST from events; popular but no mdast |
| `comrak` | 0.52 | Own AST (`AstNode`) | No serde | Full CommonMark + GFM; AST is not mdast-shaped |

### JS

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `remark-parse` (unified) | latest | Parse markdown → mdast JSON | Canonical mdast implementation; JSON-serializable |
| `remark-stringify` (unified) | latest | Serialize mdast → markdown | Good round-trip fidelity |
| `react-markdown` | latest | React component rendering | Uses remark internally |

---

## Cross-Platform Compatibility

### Test Document

```markdown
# Hello World

This is a **bold** and *italic* test.

- Item 1
- Item 2

```rust
let x = 42;
```

[A link](https://example.com)

![An image](assets/photo.png)

Some text with [[550e8400-e29b-41d4-a716-446655440000|My Other Note]] reference.

```

### Results

| Node type | Rust `markdown` | JS `remark-parse` | Compatible? |
|-----------|----------------|-------------------|-------------|
| Root | ✅ `Root { children }` | ✅ `{ type: "root", children }` | ✅ Same structure |
| Heading | ✅ `Heading { depth, children }` | ✅ `{ type: "heading", depth, children }` | ✅ |
| Paragraph | ✅ `Paragraph { children }` | ✅ `{ type: "paragraph", children }` | ✅ |
| Text | ✅ `Text { value }` | ✅ `{ type: "text", value }` | ✅ |
| Strong | ✅ `Strong { children }` | ✅ `{ type: "strong", children }` | ✅ |
| Emphasis | ✅ `Emphasis { children }` | ✅ `{ type: "emphasis", children }` | ✅ |
| List | ✅ `List { ordered, spread, children }` | ✅ `{ type: "list", ordered, spread, children }` | ✅ |
| ListItem | ✅ `ListItem { spread, checked, children }` | ✅ `{ type: "listItem", spread, checked, children }` | ✅ |
| Code | ✅ `Code { value, lang, meta }` | ✅ `{ type: "code", value, lang, meta }` | ✅ |
| Link | ✅ `Link { url, title, children }` | ✅ `{ type: "link", url, title, children }` | ✅ |
| Image | ✅ `Image { url, alt, title }` | ✅ `{ type: "image", url, alt, title }` | ✅ |
| Position | ✅ `line:col-line:col (offset)` | ✅ `{ start: {line, column, offset}, end: ... }` | ⚠️ Different format |
| `[[ref\|text]]` | Plain `Text` node | Plain `text` node | ✅ Consistent |

### Position Format Difference

Rust `markdown` crate uses `1:3-1:14 (2-13)` format (Debug only, not serializable).
JS `remark-parse` uses `{ start: { line, column, offset }, end: { ... } }` JSON.

**Impact:** Low. Position data is not required for storage or rendering in POC. If needed, positions come from whichever side does the parsing.

### `[[ref|text]]` Handling

Both parsers treat `[[uuid|text]]` as plain text within a `Text` node. This is expected — it's not standard markdown syntax.

**Solution:** Extract references via pattern matching on the raw markdown string, not from the AST.
- Rust: Manual string scanning for `[[uuid|text]]` patterns in `shared/src/references.rs` (no regex crate dependency)
- JS: Regex `\[\[([0-9a-f-]+)\|([^\]]+)\]\]` for preview rendering (convert to clickable links)

### Round-Trip Fidelity

JS `remark-stringify` reproduces the original markdown with minor formatting normalization (e.g., list marker consistency). Acceptable for POC.

---

## Decision

### Chosen Approach

**JS `remark-parse` produces the authoritative mdast JSON for storage.** Rust consumes the stored JSON as `serde_json::Value` and uses regex for reference extraction.

| Responsibility | Technology | Why |
|---------------|------------|-----|
| Editor (source + preview) | React + textarea + `react-markdown` | Simple, reliable for POC |
| AST parsing | JS `remark-parse` | Canonical mdast, JSON-serializable natively |
| AST storage | `serde_json::Value` in `content_ast` | Language-agnostic JSON blob |
| AST → markdown | JS `remark-stringify` | Round-trip fidelity |
| Reference extraction | Regex on raw markdown (both Rust & JS) | `[[ref\|text]]` is not in AST |

### Rationale

1. The `markdown` Rust crate produces correct mdast but lacks serde support — cannot directly serialize/deserialize AST JSON
2. JS `remark-parse` natively produces JSON — ideal for the storage format
3. Rust doesn't need to parse mdast for Phase 2 — only reference extraction (regex) is needed
4. Cross-platform compatibility is proven: identical node types, structure, and semantics
5. Future: if Rust-side AST manipulation is needed (MVP+), either add serde wrappers for the `markdown` crate's types or define shared types in `shared/src/model/`

### Fallback

If `remark-parse` proves insufficient: define a minimal custom AST spec in `shared/src/model/` with serde derives, parse in both languages to that format. Not needed for POC.

---

## Editor Choice

**Split-pane: textarea (source) + `react-markdown` (preview).**

- No heavy WYSIWYG dependency
- `react-markdown` uses `remark` internally — consistent AST
- Custom rendering for `[[ref|text]]` via remark plugin or text replacement
- Sufficient for POC; can upgrade to CodeMirror 6 or ProseMirror in MVP
