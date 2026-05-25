# Test Cases: Data Model

Unit tests for type validation, ID construction, label rules, and front matter serialization.

**Layer**: Unit (`#[cfg(test)]` inline or `shared_types/tests/`)
**Spec coverage**: [S-DM-L1], [S-DM-L2], [S-DM-N1], [S-DM-N2], [S-DM-N3], [S-DM-N5], [S-DM-N6], [S-DM-NR2], [S-DM-NR3], [S-DM-NR4], [S-DM-S2], [S-DM-S3], [S-DM-V2]

**Conventions**:

- Each test heading lists the spec IDs it covers in `[S-...]` brackets.
- `(provisional)` next to a spec ID flags coverage of a `[TBD]` spec; the test will be revisited once the spec is finalised.
- A `> Covers ... only.` note below a test scopes its coverage when the underlying spec is partially `[TBD]`.

---

## Labels

### TC-DM-L-01 — Valid label accepted [S-DM-L1]

**Given** a label string that is lowercase alphanumeric with hyphens  
**When** `Label::new("rust-learning")` is called  
**Then** it succeeds and `label.as_str() == "rust-learning"`

### TC-DM-L-02 — Uppercase rejected [S-DM-L1]

**Given** a label string with uppercase characters  
**When** `Label::new("Rust")` is called  
**Then** it returns an error

### TC-DM-L-03 — Spaces rejected [S-DM-L1]

**Given** a label string containing a space (`"my label"`)  
**When** `Label::new("my label")` is called  
**Then** it returns an error

### TC-DM-L-04 — Special characters rejected [S-DM-L1]

**Given** a label string with non-alphanumeric, non-hyphen characters (e.g., `"rust_learning"`, `"rust.learning"`, `"rust/learning"`)  
**When** `Label::new(...)` is called  
**Then** each returns an error

### TC-DM-L-05 — Empty string rejected [S-DM-L1]

**Given** an empty string  
**When** `Label::new("")` is called  
**Then** it returns an error

### TC-DM-L-06 — Hyphen-only string rejected [S-DM-L1]

**Given** a string of only hyphens (`"-"`, `"--"`)  
**When** `Label::new("-")` is called  
**Then** it returns an error

### TC-DM-L-07 — Leading/trailing hyphen rejected [S-DM-L1]

**Given** a string with a leading or trailing hyphen (`"-rust"`, `"rust-"`)  
**When** `Label::new(...)` is called  
**Then** it returns an error

---

## SpaceId

### TC-DM-SID-01 — Single-segment root space accepted [S-DM-S2], [S-DM-S3]

**Given** a space name `"my-space"`  
**When** `SpaceId::new("my-space")` is called  
**Then** it succeeds and `id.as_str() == "my-space"`

### TC-DM-SID-02 — Multi-segment hierarchical ID accepted [S-DM-S3]

**Given** a string `"sub.parent.root"`  
**When** `SpaceId::new("sub.parent.root")` is called  
**Then** it succeeds and `id.segments_root_first()` returns `["root", "parent", "sub"]`

### TC-DM-SID-03 — Parent of hierarchical ID [S-DM-S3]

**Given** `SpaceId::new("sub.parent.root")`  
**When** `.parent()` is called  
**Then** it returns `Some(SpaceId("parent.root"))`

### TC-DM-SID-04 — Parent of root space is None [S-DM-S3]

**Given** `SpaceId::new("my-space")`  
**When** `.parent()` is called  
**Then** it returns `None`

### TC-DM-SID-05 — Uppercase segments rejected [S-DM-S2]

**Given** a string `"MySpace"`  
**When** `SpaceId::new("MySpace")` is called  
**Then** it returns an error

### TC-DM-SID-06 — Empty segment rejected [S-DM-S2]

**Given** a string with consecutive dots or leading/trailing dot (`"a..b"`, `".a"`, `"a."`)  
**When** `SpaceId::new(...)` is called  
**Then** each returns an error

### TC-DM-SID-07 — Special characters rejected [S-DM-S2]

**Given** a string with slashes, underscores, or spaces (`"my/space"`)  
**When** `SpaceId::new("my/space")` is called  
**Then** it returns an error

---

## NoteId

### TC-DM-NID-01 — Root note in space accepted [S-DM-N3]

**Given** a string `"space1/note1"`  
**When** `NoteId::new("space1/note1")` is called  
**Then** it succeeds; `id.name() == "note1"`, `id.space_segment() == "space1"`

### TC-DM-NID-02 — Nested note ID accepted [S-DM-N3]

**Given** a string `"space1/parent-note/child-note"`  
**When** `NoteId::new("space1/parent-note/child-note")` is called  
**Then** it succeeds; `id.segments()` returns `["space1", "parent-note", "child-note"]`

### TC-DM-NID-03 — Parent of nested note [S-DM-N1]

**Given** `NoteId::new("space1/parent/child")`  
**When** `.parent()` is called  
**Then** it returns `Some(NoteId("space1/parent"))`

### TC-DM-NID-04 — Parent of root note is None [S-DM-N1]

**Given** `NoteId::new("space1/root-note")`  
**When** `.parent()` is called  
**Then** it returns `None`

### TC-DM-NID-05 — Bare name (no space) rejected [S-DM-N3]

**Given** a string `"justnote"` (no slash)  
**When** `NoteId::new("justnote")` is called  
**Then** it returns an error

### TC-DM-NID-06 — Uppercase in segment rejected [S-DM-N3]

**Given** a string `"space1/MyNote"`  
**When** `NoteId::new("space1/MyNote")` is called  
**Then** it returns an error

### TC-DM-NID-07 — Empty segment rejected [S-DM-N3]

**Given** a string with consecutive slashes or trailing slash (`"space1//note"`, `"space1/note/"`)  
**When** `NoteId::new(...)` is called  
**Then** each returns an error

---

## ViewId

### TC-DM-VID-01 — Labels sorted alphabetically [S-DM-V2]

**Given** labels `["zebra", "alpha", "middle"]`  
**When** `ViewId::from_labels(&["zebra", "alpha", "middle"])` is called  
**Then** `id.as_str() == "alpha-middle-zebra"`

### TC-DM-VID-02 — Single label view [S-DM-V2]

**Given** a single label `"rust"`  
**When** `ViewId::from_labels(&["rust"])` is called  
**Then** `id.as_str() == "rust"`

### TC-DM-VID-03 — Duplicate labels de-duplicated [S-DM-V2]

**Given** labels with duplicates `["rust", "rust", "learning"]`  
**When** `ViewId::from_labels(...)` is called  
**Then** the resulting ID contains each label only once: `"learning-rust"`

### TC-DM-VID-04 — Empty label list rejected [S-DM-V2]

**Given** an empty label list  
**When** `ViewId::from_labels(&[])` is called  
**Then** it returns an error

### TC-DM-VID-05 — Invalid label in list propagates error [S-DM-L1]

**Given** labels including an invalid one `["valid", "INVALID"]`  
**When** `ViewId::from_labels(...)` is called  
**Then** it returns an error

---

## Front Matter — Parsing

### TC-DM-FM-01 — Full front matter round-trip [S-DM-N2], [S-DM-N5]

**Given** a markdown string with a valid YAML front matter block containing all fields (uuid, title, space, labels, draft, created_at, updated_at, references)  
**When** `parse_note_content(raw)` is called  
**Then** it returns `(NoteMetadata, content_body)` with all fields correctly populated and no loss of data  
**And** `serialize_note_content(&metadata, &content_body)` produces a string that parses back to the same values

### TC-DM-FM-02 — Missing optional fields default correctly [S-DM-N5]

**Given** a markdown string with only the required front matter fields (uuid, title, created_at, updated_at)  
**When** `parse_note_content(raw)` is called  
**Then** `metadata.space == None`, `metadata.labels == []`, `metadata.draft == false`, `metadata.references == []`

### TC-DM-FM-03 — Labels parsed as space-separated words [S-DM-N5]

**Given** front matter with `labels: rust learning project`  
**When** `parse_note_content(raw)` is called  
**Then** `metadata.labels` equals `[Label("rust"), Label("learning"), Label("project")]`

### TC-DM-FM-04 — References serialized and parsed [S-DM-NR3]

**Given** metadata with a note reference (`kind: note, target: space1/other-note, block_id: section-1, source_block_id: ref-1`), a space reference, and an external URL reference  
**When** `serialize_note_content` then `parse_note_content` is applied  
**Then** all three references are present in the parsed output with correct kinds, targets, and block IDs

### TC-DM-FM-05 — Content body separated from front matter [S-DM-N2]

**Given** a markdown string with front matter followed by `\n# My Note\n\nSome content.`  
**When** `parse_note_content(raw)` is called  
**Then** the returned content string is `"# My Note\n\nSome content."` (no front matter delimiter)

### TC-DM-FM-06 — Missing front matter returns error [S-DM-N6]

**Given** a markdown string with no `---` delimiters  
**When** `parse_note_content(raw)` is called  
**Then** it returns a `FrontMatterError`

### TC-DM-FM-07 — Malformed YAML returns error [S-DM-N6]

**Given** a markdown string with a `---` delimited block containing invalid YAML  
**When** `parse_note_content(raw)` is called  
**Then** it returns a `FrontMatterError`

### TC-DM-FM-08 — UUID is preserved exactly on round-trip [S-DM-N5]

**Given** a note with a specific UUID  
**When** it is serialized and parsed back  
**Then** `metadata.uuid` is identical to the original

### TC-DM-FM-09 — Draft flag serializes as boolean [S-DM-N5]

**Given** metadata with `draft: true`  
**When** serialized and parsed  
**Then** `metadata.draft == true`

---

## Note References

### TC-DM-NR-01 — Note reference with block IDs parsed [S-DM-NR4]

**Given** a reference entry `kind: note, target: space1/note, block_id: section-1, source_block_id: ref-1`  
**When** parsed from front matter  
**Then** `reference.block_id == Some("section-1")` and `reference.source_block_id == Some("ref-1")`

### TC-DM-NR-02 — External URL reference parsed [S-DM-NR3]

**Given** a reference entry `kind: external, target: https://example.com`  
**When** parsed from front matter  
**Then** `reference.target == NoteReferenceKind::External { url: "https://example.com" }`

### TC-DM-NR-03 — File reference parsed [S-DM-NR3]

**Given** a reference entry `kind: file, target: attachments/diagram.png`  
**When** parsed from front matter  
**Then** `reference.target == NoteReferenceKind::File { path: "attachments/diagram.png" }`

### TC-DM-NR-04 — Space reference parsed [S-DM-NR3]

**Given** a reference entry `kind: space, target: sub.parent.root`  
**When** parsed from front matter  
**Then** `reference.target == NoteReferenceKind::Space { id: SpaceId("sub.parent.root") }`

### TC-DM-NR-05 — Internal reference parsed from markdown link syntax [S-DM-NR2]

**Given** note content containing the markdown link `[target](note://space1/target-note#section-1)`  
**When** content is scanned for references  
**Then** the extracted reference has `kind: note`, `target: "space1/target-note"`, `block_id: Some("section-1")`

### TC-DM-NR-06 — External URL preserved from markdown link syntax [S-DM-NR2]

**Given** note content containing the markdown link `[docs](https://example.com/path)`  
**When** content is scanned for references  
**Then** the extracted reference has `kind: external`, `target: "https://example.com/path"`, and the link text `"docs"` is preserved in content unchanged
