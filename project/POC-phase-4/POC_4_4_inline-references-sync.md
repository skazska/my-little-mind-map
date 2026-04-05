# Task 4.4 — Inline References with Index Sync

> Implement bidirectional sync between inline references in note content and the reference index.

| | |
|---|---|
| **Phase** | [Phase 4: Linking](../POC-phase-4-status.md) |
| **Requirements** | P4-R4, P4-R9, P4-R10, D-009, NFR-4.1 |
| **Decisions** | D-009 (reference index sync — this is the core implementation) |
| **Depends on** | 4.1, 2.1 |
| **Blocks** | — |
| **Status** | Not started |

---

## Goal

Implement the core D-009 mechanism: in-text markdown references and the `references.json` index stay bidirectionally in sync.

## Scope

### Direction 1: Text → Index (on save)

1. Parse note AST
2. Walk AST to find all reference nodes:
   - Internal links: `[[note-id|text]]`
   - Asset embeds: `![alt](assets/filename)`
3. Build the set of current references from AST
4. Compare with existing references in `references.json` for this note
5. Add new references to index
6. Remove stale references from index (were in index but no longer in text)

### Direction 2: Index → Text (on external change)

When the reference index changes externally (e.g., target note deleted → reference marked broken):

1. On note load: check if any of this note's references are marked broken in the index
2. Optionally update the AST to mark broken reference nodes (e.g., add `broken` attribute)
3. Editor renders broken references with visual indicator (strikethrough, red, tooltip)

### Reference Parsing

Custom AST node for internal references:

```
Node type: "internalReference"
Properties:
  - targetId: UUID string
  - displayText: string
  - broken: boolean
Raw syntax: [[target-id|display text]]
```

This requires extending the markdown parser (either remark plugin on JS side or markdown-rs extension on Rust side).

### Changes

- `shared/src/` — reference extraction logic from AST
- `storage/src/index.rs` — reference sync function
- `desktop-app/src/` — remark plugin for `[[...]]` syntax (if using remark)
- CRUX update handlers — call reference sync on save

### Sync Algorithm

```rust
fn sync_references(store: &StorageHandle, note_id: &Uuid, ast: &Ast) -> Result<()> {
    let ast_refs = extract_references_from_ast(ast);
    let index_refs = get_forward_links(store, note_id)?;
    
    let to_add: Vec<_> = ast_refs.iter()
        .filter(|r| !index_refs.contains(r))
        .collect();
    let to_remove: Vec<_> = index_refs.iter()
        .filter(|r| !ast_refs.contains(r))
        .collect();
    
    for ref_ in to_add { add_reference(store, ref_)?; }
    for ref_ in to_remove { remove_reference(store, &note_id, &ref_.target_note_id)?; }
    
    Ok(())
}
```

## Tests

- [ ] Add reference in text → save → appears in index
- [ ] Remove reference from text → save → removed from index
- [ ] No duplicate references in index
- [ ] Broken references in index → shown as broken in editor
- [ ] Asset embeds tracked in index alongside text references
- [ ] Round-trip: save → reload → same references

## Acceptance Criteria

- [ ] On save: text references extracted and index updated
- [ ] Stale references cleaned up
- [ ] Broken references surfaced in editor
- [ ] `[[...]]` syntax parsed correctly in AST
- [ ] Bidirectional sync reliable and consistent
