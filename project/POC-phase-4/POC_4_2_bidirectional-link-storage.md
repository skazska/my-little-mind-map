# Task 4.2 — Bidirectional Link Storage and Resolution

> Implement storage and resolution logic for bidirectional links between notes.

| | |
|---|---|
| **Phase** | [Phase 4: Linking](../POC-phase-4-status.md) |
| **Requirements** | P4-R3, P4-R11, FR-D6.3 |
| **Decisions** | D-009 (reference index sync), D-002 (reference properties) |
| **Depends on** | Phase 1 (1.2, 1.3) |
| **Blocks** | 4.3 |
| **Status** | Not started |

---

## Goal

Ensure all note-to-note links are stored bidirectionally in the reference index and can be resolved efficiently.

## Scope

### Bidirectional Guarantee

When note A references note B:

- `references.json` contains entry: `{ source: A, target: B, type: "links-to" }`
- Backlink query for B returns A (no separate entry needed — query both directions)

### Reference Properties (D-002)

Each reference entry includes:

- `source_note_id`: the note containing the reference text
- `target_note_id`: the referenced note
- `reference_type`: `links-to` (text reference), `embeds` (asset embed)
- `isOriginal`: always `true` for the source note (where user typed the reference)
- `created_at`: timestamp

### Resolution Logic

```rust
/// Get all notes that reference the given note (backlinks)
fn get_backlinks(note_id: &Uuid) -> Vec<NoteReference> {
    // Query references where target_note_id == note_id
}

/// Get all notes referenced by the given note (forward links)
fn get_forward_links(note_id: &Uuid) -> Vec<NoteReference> {
    // Query references where source_note_id == note_id
}

/// Get all references for a note (both directions)
fn get_all_links(note_id: &Uuid) -> (Vec<NoteReference>, Vec<NoteReference>) {
    (get_forward_links(note_id), get_backlinks(note_id))
}
```

### Broken Reference Detection (FR-D6.7, NFR-4.3)

When a note is deleted:

1. Find all references where `target_note_id == deleted_id`
2. Mark those references as broken in the index (add `broken: true` field)
3. Optionally: update source notes' AST to mark the reference node as broken

### Changes

- `storage/src/relations.rs` — backlink and forward link queries
- `shared/src/model/relation.rs` — add `broken` field to `NoteReference`
- Storage library: `mark_references_broken()` function

## Tests

- [ ] Creating A→B link: backlinks for B returns A
- [ ] Forward links for A returns B
- [ ] Deleting B: references from A to B marked as broken
- [ ] No duplicate entries in index
- [ ] Reference properties (type, isOriginal, created_at) preserved

## Acceptance Criteria

- [ ] All references queryable in both directions
- [ ] Broken references detected on note deletion
- [ ] Reference properties stored correctly
- [ ] No orphaned references (cleanup on delete)
