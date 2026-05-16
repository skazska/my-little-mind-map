use shared_types::{
    ids::{NoteId, SpaceId},
    model::{Label, Note, NoteMetadata, Space},
};
use storage::{FsStorage, Storage};
use tempfile::TempDir;

async fn make_storage() -> (TempDir, FsStorage) {
    let tmp = TempDir::new().unwrap();
    let fs = FsStorage::new(tmp.path()).await.unwrap();
    (tmp, fs)
}

fn sample_space() -> Space {
    Space {
        id: SpaceId::new("test-space").unwrap(),
        name: "Test Space".to_string(),
        description: Some("A space for testing".to_string()),
        labels: vec![Label("testing".to_string())],
        parent_id: None,
        note_count: 0,
    }
}

fn sample_note(space_id: &SpaceId, name: &str) -> Note {
    let id = NoteId::new(format!("{}/{}", space_id.as_str(), name)).unwrap();
    let mut meta = NoteMetadata::new(name, Some(space_id.clone()));
    meta.labels = vec![Label("rust".to_string()), Label("testing".to_string())];
    meta.draft = false;
    Note {
        id,
        metadata: meta,
        content: format!("# {}\n\nNote content.", name),
        parent_id: None,
    }
}

#[tokio::test]
async fn create_and_retrieve_space() {
    let (_tmp, storage) = make_storage().await;
    let space = sample_space();

    storage.create_space(&space).await.unwrap();

    let retrieved = storage.get_space(&space.id).await.unwrap();
    assert!(retrieved.is_some());
    let retrieved = retrieved.unwrap();
    assert_eq!(retrieved.id, space.id);
    assert_eq!(retrieved.name, space.name);
}

#[tokio::test]
async fn list_spaces() {
    let (_tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    let spaces = storage.list_spaces().await.unwrap();
    assert_eq!(spaces.len(), 1);
    assert_eq!(spaces[0].id, space.id);
}

#[tokio::test]
async fn delete_space() {
    let (_tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();
    storage.delete_space(&space.id).await.unwrap();

    let spaces = storage.list_spaces().await.unwrap();
    assert!(spaces.is_empty());
    assert!(storage.get_space(&space.id).await.unwrap().is_none());
}

#[tokio::test]
async fn create_and_retrieve_note() {
    let (_tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    let note = sample_note(&space.id, "my-note");
    storage.create_note(&note).await.unwrap();

    let retrieved = storage.get_note(&note.id).await.unwrap();
    assert!(retrieved.is_some());
    let retrieved = retrieved.unwrap();
    assert_eq!(retrieved.id, note.id);
    assert_eq!(retrieved.metadata.title, note.metadata.title);
    assert!(retrieved.content.contains("Note content."));
}

#[tokio::test]
async fn update_note_persists_changes() {
    let (_tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    let mut note = sample_note(&space.id, "update-me");
    storage.create_note(&note).await.unwrap();

    note.content = "# update-me\n\nUpdated content.".to_string();
    note.metadata.labels = vec![Label("updated".to_string())];
    note.metadata.touch();
    storage.update_note(&note).await.unwrap();

    let retrieved = storage.get_note(&note.id).await.unwrap().unwrap();
    assert!(retrieved.content.contains("Updated content."));
    assert_eq!(retrieved.metadata.labels.len(), 1);
    assert_eq!(retrieved.metadata.labels[0].0, "updated");
}

#[tokio::test]
async fn delete_note() {
    let (_tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    let note = sample_note(&space.id, "to-delete");
    storage.create_note(&note).await.unwrap();
    storage.delete_note(&note.id).await.unwrap();

    assert!(storage.get_note(&note.id).await.unwrap().is_none());
}

#[tokio::test]
async fn labels_index_updated_on_create() {
    let (_tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    let note = sample_note(&space.id, "labeled-note");
    storage.create_note(&note).await.unwrap();

    let index = storage.get_labels_index().await.unwrap();
    let rust_notes = index.notes_for_label("rust");
    assert!(rust_notes.iter().any(|id| id == &note.id));
    let testing_notes = index.notes_for_label("testing");
    assert!(testing_notes.iter().any(|id| id == &note.id));
}

#[tokio::test]
async fn labels_index_cleaned_on_delete() {
    let (_tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    let note = sample_note(&space.id, "labeled-note");
    storage.create_note(&note).await.unwrap();
    storage.delete_note(&note.id).await.unwrap();

    let index = storage.get_labels_index().await.unwrap();
    assert!(index.notes_for_label("rust").is_empty());
}

#[tokio::test]
async fn labels_index_updated_on_update() {
    let (_tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    let mut note = sample_note(&space.id, "relabeled");
    storage.create_note(&note).await.unwrap();

    // Replace labels entirely.
    note.metadata.labels = vec![Label("new-label".to_string())];
    note.metadata.touch();
    storage.update_note(&note).await.unwrap();

    let index = storage.get_labels_index().await.unwrap();
    assert!(index.notes_for_label("rust").is_empty()); // old label gone
    assert!(index
        .notes_for_label("new-label")
        .iter()
        .any(|id| id == &note.id));
}

#[tokio::test]
async fn settings_round_trip() {
    let (_tmp, storage) = make_storage().await;

    let mut settings = storage.get_settings().await.unwrap();
    settings.theme = Some("dark".to_string());
    storage.update_settings(&settings).await.unwrap();

    let reloaded = storage.get_settings().await.unwrap();
    assert_eq!(reloaded.theme.as_deref(), Some("dark"));
}

#[tokio::test]
async fn get_note_missing_returns_none() {
    let (_tmp, storage) = make_storage().await;
    let id = NoteId::new("space1/nonexistent").unwrap();
    assert!(storage.get_note(&id).await.unwrap().is_none());
}

#[tokio::test]
async fn folder_note_layout_on_disk() {
    let (tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    let note = sample_note(&space.id, "disk-layout");
    storage.create_note(&note).await.unwrap();

    // File must exist at spaces/<space-id>/<note-name>.md
    let expected = tmp
        .path()
        .join("spaces")
        .join("test-space")
        .join("disk-layout.md");
    assert!(
        expected.exists(),
        "note file not found at expected path: {expected:?}"
    );

    // labels.json must have been created.
    let labels_json = tmp.path().join("labels.json");
    assert!(labels_json.exists(), "labels.json not found");
}

// ── Spaces — additional (TC-ST-SP-02, TC-ST-SP-03, TC-ST-SP-05, TC-ST-SP-07, TC-ST-SP-08) ──

/// TC-ST-SP-02 — Space directory created on disk [S-ST-DM4]
#[tokio::test]
async fn space_directory_created_on_disk() {
    let (tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    let expected = tmp.path().join("spaces").join("test-space");
    assert!(expected.is_dir(), "space directory not found at {expected:?}");
}

/// TC-ST-SP-03 — Nested space directory uses reversed dot notation [S-ST-DM4]
#[tokio::test]
async fn nested_space_directory_reversed_dot() {
    let (tmp, storage) = make_storage().await;
    let space = Space {
        id: SpaceId::new("sub.parent.root").unwrap(),
        name: "Sub".to_string(),
        description: None,
        labels: vec![],
        parent_id: Some(SpaceId::new("parent.root").unwrap()),
        note_count: 0,
    };
    storage.create_space(&space).await.unwrap();

    let expected = tmp
        .path()
        .join("spaces")
        .join("root")
        .join("parent")
        .join("sub");
    assert!(expected.is_dir(), "nested space dir not found at {expected:?}");
}

/// TC-ST-SP-05 — Get non-existent space returns None
#[tokio::test]
async fn get_nonexistent_space_returns_none() {
    let (_tmp, storage) = make_storage().await;
    let id = SpaceId::new("ghost-space").unwrap();
    assert!(storage.get_space(&id).await.unwrap().is_none());
}

/// TC-ST-SP-07 — Delete non-existent space returns error
#[tokio::test]
async fn delete_nonexistent_space_returns_error() {
    let (_tmp, storage) = make_storage().await;
    let id = SpaceId::new("ghost-space").unwrap();
    assert!(
        storage.delete_space(&id).await.is_err(),
        "expected error when deleting non-existent space"
    );
}

/// TC-ST-SP-08 — Spaces index reflects parent→child hierarchy
#[tokio::test]
async fn spaces_index_reflects_hierarchy() {
    let (_tmp, storage) = make_storage().await;
    let parent = Space {
        id: SpaceId::new("parent").unwrap(),
        name: "Parent".to_string(),
        description: None,
        labels: vec![],
        parent_id: None,
        note_count: 0,
    };
    let child = Space {
        id: SpaceId::new("child.parent").unwrap(),
        name: "Child".to_string(),
        description: None,
        labels: vec![],
        parent_id: Some(SpaceId::new("parent").unwrap()),
        note_count: 0,
    };
    storage.create_space(&parent).await.unwrap();
    storage.create_space(&child).await.unwrap();

    let index = storage.get_spaces_index().await.unwrap();
    let parent_entry = index
        .spaces
        .iter()
        .find(|e| e.id == parent.id)
        .expect("parent not in index");
    assert!(
        parent_entry.child_ids.contains(&child.id),
        "parent entry must list child in child_ids"
    );
}

// ── Notes — additional (TC-ST-N-03, TC-ST-N-04, TC-ST-N-06, TC-ST-N-08, TC-ST-N-10) ──

/// TC-ST-N-03 — Nested note file created at correct path [S-ST-DM4]
#[tokio::test]
async fn nested_note_file_correct_path() {
    let (tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    let note_id = NoteId::new("test-space/parent/child").unwrap();
    let mut meta = NoteMetadata::new("child", Some(space.id.clone()));
    meta.draft = false;
    let note = Note {
        id: note_id,
        metadata: meta,
        content: "# child\n\nContent.".into(),
        parent_id: None,
    };
    storage.create_note(&note).await.unwrap();

    let expected = tmp
        .path()
        .join("spaces")
        .join("test-space")
        .join("parent")
        .join("child.md");
    assert!(expected.exists(), "nested note not found at {expected:?}");
}

/// TC-ST-N-04 — Note file starts with valid YAML front matter [S-ST-DM3]
#[tokio::test]
async fn note_file_contains_valid_front_matter() {
    let (tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    let note = sample_note(&space.id, "fm-check");
    storage.create_note(&note).await.unwrap();

    let path = tmp
        .path()
        .join("spaces")
        .join("test-space")
        .join("fm-check.md");
    let content = std::fs::read_to_string(&path).unwrap();
    assert!(
        content.starts_with("---"),
        "note file must start with front matter delimiter"
    );
    // Must contain uuid and title keys
    assert!(content.contains("uuid:"));
    assert!(content.contains("title:"));
}

/// TC-ST-N-06 — Update note advances updated_at timestamp [S-DM-N5]
#[tokio::test]
async fn update_note_advances_updated_at() {
    let (_tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    let note = sample_note(&space.id, "timestamp-test");
    storage.create_note(&note).await.unwrap();
    let created_at = storage
        .get_note(&note.id)
        .await
        .unwrap()
        .unwrap()
        .metadata
        .updated_at;

    // Ensure at least 1ms passes so timestamps differ.
    tokio::time::sleep(std::time::Duration::from_millis(5)).await;

    let mut updated = note.clone();
    updated.content = "# timestamp-test\n\nUpdated.".into();
    updated.metadata.touch();
    storage.update_note(&updated).await.unwrap();

    let after = storage
        .get_note(&note.id)
        .await
        .unwrap()
        .unwrap()
        .metadata
        .updated_at;

    assert!(after > created_at, "updated_at must advance after update");
}

/// TC-ST-N-08 — Delete note removes companion folder [S-ST-DM4]
#[tokio::test]
async fn delete_note_removes_companion_folder() {
    let (tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    // Create a parent note
    let parent = sample_note(&space.id, "parent-note");
    storage.create_note(&parent).await.unwrap();

    // Create a child note — this produces the companion folder
    let child_id = NoteId::new("test-space/parent-note/child").unwrap();
    let mut child_meta = NoteMetadata::new("child", Some(space.id.clone()));
    child_meta.draft = false;
    let child = Note {
        id: child_id,
        metadata: child_meta,
        content: "# child\n\nChild content.".into(),
        parent_id: Some(parent.id.clone()),
    };
    storage.create_note(&child).await.unwrap();

    // The companion dir should exist.
    let companion_dir = tmp
        .path()
        .join("spaces")
        .join("test-space")
        .join("parent-note");
    assert!(companion_dir.is_dir(), "companion dir must exist before delete");

    storage.delete_note(&parent.id).await.unwrap();

    let parent_file = tmp
        .path()
        .join("spaces")
        .join("test-space")
        .join("parent-note.md");
    assert!(!parent_file.exists(), "parent .md must be removed");
    assert!(!companion_dir.exists(), "companion dir must be removed");
}

/// TC-ST-N-10 — list_notes returns direct children only [S-DM-N1]
#[tokio::test]
async fn list_notes_returns_direct_children_only() {
    let (_tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    let note_a = sample_note(&space.id, "note-a");
    let note_b = sample_note(&space.id, "note-b");
    storage.create_note(&note_a).await.unwrap();
    storage.create_note(&note_b).await.unwrap();

    // Create a child note inside note-a (nested)
    let child_id = NoteId::new("test-space/note-a/child").unwrap();
    let mut child_meta = NoteMetadata::new("child", Some(space.id.clone()));
    child_meta.draft = false;
    let child = Note {
        id: child_id.clone(),
        metadata: child_meta,
        content: "# child\n\nChild.".into(),
        parent_id: Some(note_a.id.clone()),
    };
    storage.create_note(&child).await.unwrap();

    let ids = storage.list_notes(&space.id).await.unwrap();
    assert!(ids.contains(&note_a.id), "note-a must be in list");
    assert!(ids.contains(&note_b.id), "note-b must be in list");
    assert!(
        !ids.contains(&child_id),
        "nested note must NOT be in direct children list"
    );
}

// ── Labels index — additional (TC-ST-LI-04, TC-ST-LI-05) ────────────────────

/// TC-ST-LI-04 — Label shared by multiple notes remains after partial delete [S-DM-L4]
#[tokio::test]
async fn shared_label_survives_partial_delete() {
    let (_tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    let note_a = sample_note(&space.id, "note-la");
    let note_b = sample_note(&space.id, "note-lb");
    // Both notes have the "testing" label (from sample_note)
    storage.create_note(&note_a).await.unwrap();
    storage.create_note(&note_b).await.unwrap();

    storage.delete_note(&note_a.id).await.unwrap();

    let index = storage.get_labels_index().await.unwrap();
    let remaining = index.notes_for_label("testing");
    assert!(
        remaining.iter().any(|id| id == &note_b.id),
        "testing label must still map to note_b"
    );
}

/// TC-ST-LI-05 — Cross-space labels span spaces [S-DM-L2]
#[tokio::test]
async fn cross_space_label_spans_spaces() {
    let (_tmp, storage) = make_storage().await;

    let space1 = Space {
        id: SpaceId::new("space-one").unwrap(),
        name: "Space One".into(),
        description: None,
        labels: vec![],
        parent_id: None,
        note_count: 0,
    };
    let space2 = Space {
        id: SpaceId::new("space-two").unwrap(),
        name: "Space Two".into(),
        description: None,
        labels: vec![],
        parent_id: None,
        note_count: 0,
    };
    storage.create_space(&space1).await.unwrap();
    storage.create_space(&space2).await.unwrap();

    let note1 = sample_note(&space1.id, "cross-note");
    let mut note2_meta = NoteMetadata::new("cross-note", Some(space2.id.clone()));
    note2_meta.labels = vec![Label("testing".to_string())]; // same label as note1
    note2_meta.draft = false;
    let note2 = Note {
        id: NoteId::new("space-two/cross-note").unwrap(),
        metadata: note2_meta,
        content: "# cross-note\n\nContent.".into(),
        parent_id: None,
    };
    storage.create_note(&note1).await.unwrap();
    storage.create_note(&note2).await.unwrap();

    let index = storage.get_labels_index().await.unwrap();
    let testing_notes = index.notes_for_label("testing");
    assert!(testing_notes.iter().any(|id| id == &note1.id));
    assert!(testing_notes.iter().any(|id| id == &note2.id));
}

// ── References index (TC-ST-RI-01..04) ───────────────────────────────────────

fn note_with_reference(space_id: &SpaceId, name: &str, target_id: &NoteId) -> Note {
    use shared_types::model::{NoteReference, NoteReferenceKind};
    let id = NoteId::new(format!("{}/{}", space_id.as_str(), name)).unwrap();
    let mut meta = NoteMetadata::new(name, Some(space_id.clone()));
    meta.references = vec![NoteReference {
        target: NoteReferenceKind::Note {
            id: target_id.clone(),
        },
        block_id: Some("section-1".into()),
        source_block_id: Some("ref-1".into()),
    }];
    meta.draft = false;
    Note {
        id,
        metadata: meta,
        content: format!("# {name}\n\nContent."),
        parent_id: None,
    }
}

/// TC-ST-RI-01 — Forward reference stored on note create [S-DM-NR5]
#[tokio::test]
async fn references_index_forward_on_create() {
    let (_tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    let target_id = NoteId::new("test-space/target-note").unwrap();
    let note = note_with_reference(&space.id, "source-note", &target_id);
    storage.create_note(&note).await.unwrap();

    let refs = storage.get_references_index().await.unwrap();
    let forward = refs.forward.get(note.id.as_str()).expect("forward entry must exist");
    assert!(
        forward.iter().any(|e| e.note_id == target_id.as_str()),
        "forward ref to target must be present"
    );
}

/// TC-ST-RI-02 — Backlink stored on note create [S-DM-NR5]
#[tokio::test]
async fn references_index_backlink_on_create() {
    let (_tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    let target_id = NoteId::new("test-space/target-note").unwrap();
    let note = note_with_reference(&space.id, "source-note", &target_id);
    storage.create_note(&note).await.unwrap();

    let refs = storage.get_references_index().await.unwrap();
    let backward = refs
        .backward
        .get(target_id.as_str())
        .expect("backward entry must exist");
    assert!(
        backward.iter().any(|e| e.note_id == note.id.as_str()),
        "backlink from target to source must be present"
    );
}

/// TC-ST-RI-03 — References index rebuilt on update
#[tokio::test]
async fn references_index_rebuilt_on_update() {
    let (_tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    let old_target = NoteId::new("test-space/old-target").unwrap();
    let mut note = note_with_reference(&space.id, "source-note", &old_target);
    storage.create_note(&note).await.unwrap();

    // Update to reference a new target
    let new_target = NoteId::new("test-space/new-target").unwrap();
    use shared_types::model::{NoteReference, NoteReferenceKind};
    note.metadata.references = vec![NoteReference {
        target: NoteReferenceKind::Note {
            id: new_target.clone(),
        },
        block_id: None,
        source_block_id: None,
    }];
    note.metadata.touch();
    storage.update_note(&note).await.unwrap();

    let refs = storage.get_references_index().await.unwrap();

    // Old target must be gone
    let old_back = refs
        .backward
        .get(old_target.as_str())
        .cloned()
        .unwrap_or_default();
    assert!(
        !old_back.iter().any(|e| e.note_id == note.id.as_str()),
        "old backlink must be removed"
    );

    // New target must be present
    let new_back = refs.backward.get(new_target.as_str()).expect("new backlink must exist");
    assert!(
        new_back.iter().any(|e| e.note_id == note.id.as_str()),
        "new backlink must be present"
    );
}

/// TC-ST-RI-04 — References index cleared on delete
#[tokio::test]
async fn references_index_cleared_on_delete() {
    let (_tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    let target_id = NoteId::new("test-space/target-note").unwrap();
    let note = note_with_reference(&space.id, "source-note", &target_id);
    storage.create_note(&note).await.unwrap();
    storage.delete_note(&note.id).await.unwrap();

    let refs = storage.get_references_index().await.unwrap();
    assert!(
        !refs.forward.contains_key(note.id.as_str()),
        "forward refs for deleted note must be gone"
    );
    let back = refs
        .backward
        .get(target_id.as_str())
        .cloned()
        .unwrap_or_default();
    assert!(
        !back.iter().any(|e| e.note_id == note.id.as_str()),
        "backlink from deleted note must be gone"
    );
}

// ── Definitions index — test-first stubs (TC-ST-DI-01, TC-ST-DI-02) ─────────
// These tests are marked #[ignore] because definitions parsing in content
// is not yet implemented in FsStorage::sync_indexes_for_note. [S-DM-ND2]

/// TC-ST-DI-01 — Definitions indexed on note create [S-DM-ND2]
#[tokio::test]
#[ignore = "test-first: definitions parsing not yet implemented in FsStorage"]
async fn definitions_indexed_on_create() {
    let (_tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    // Note content contains a markdown-style definition: **Term** Definition text
    let mut meta = NoteMetadata::new("def-note", Some(space.id.clone()));
    meta.draft = false;
    let note = Note {
        id: NoteId::new("test-space/def-note").unwrap(),
        metadata: meta,
        content: "# def-note\n\n**Widget** A reusable UI component.".into(),
        parent_id: None,
    };
    storage.create_note(&note).await.unwrap();

    let defs = storage.get_definitions_index().await.unwrap();
    let entries = defs.entries.get("widget").expect("definition must be indexed");
    assert!(entries.iter().any(|e| e.note_id == note.id));
}

/// TC-ST-DI-02 — Definitions removed on note delete [S-DM-ND2]
#[tokio::test]
#[ignore = "test-first: definitions parsing not yet implemented in FsStorage"]
async fn definitions_removed_on_delete() {
    let (_tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    let mut meta = NoteMetadata::new("def-note2", Some(space.id.clone()));
    meta.draft = false;
    let note = Note {
        id: NoteId::new("test-space/def-note2").unwrap(),
        metadata: meta,
        content: "# def-note2\n\n**Gadget** Another component.".into(),
        parent_id: None,
    };
    storage.create_note(&note).await.unwrap();
    storage.delete_note(&note.id).await.unwrap();

    let defs = storage.get_definitions_index().await.unwrap();
    let entries = defs.entries.get("gadget").cloned().unwrap_or_default();
    assert!(entries.is_empty(), "definition must be removed on note delete");
}

// ── Settings — additional (TC-ST-SET-01, TC-ST-SET-03) ───────────────────────

/// TC-ST-SET-01 — Default settings returned when file absent
#[tokio::test]
async fn default_settings_when_absent() {
    let (_tmp, storage) = make_storage().await;
    // No settings.json created — should return defaults without error.
    let settings = storage.get_settings().await.unwrap();
    // Default values: no error thrown, fields are empty/None.
    let _ = settings; // just verifying no panic/error
}

/// TC-ST-SET-03 — Settings stored as JSON [S-ST-DM2]
#[tokio::test]
async fn settings_stored_as_valid_json() {
    let (tmp, storage) = make_storage().await;
    let mut settings = storage.get_settings().await.unwrap();
    settings.theme = Some("dark".to_string());
    storage.update_settings(&settings).await.unwrap();

    let path = tmp.path().join("settings.json");
    let content = std::fs::read_to_string(&path).expect("settings.json must exist");
    let parsed: serde_json::Value =
        serde_json::from_str(&content).expect("settings.json must be valid JSON");
    assert_eq!(parsed["theme"], "dark");
}

// ── Error handling — additional (TC-ST-ERR-02, TC-ST-ERR-03, TC-ST-ERR-04) ──

/// TC-ST-ERR-02 — Corrupt front matter file returns error, not panic
#[tokio::test]
async fn corrupt_front_matter_returns_error() {
    let (tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    // Write a corrupt .md file directly
    let corrupt_path = tmp
        .path()
        .join("spaces")
        .join("test-space")
        .join("corrupt-note.md");
    std::fs::write(&corrupt_path, "---\n: bad yaml: [\n---\n\nContent.").unwrap();

    let id = NoteId::new("test-space/corrupt-note").unwrap();
    let result = storage.get_note(&id).await;
    assert!(result.is_err(), "corrupt front matter must return Err");
}

/// TC-ST-ERR-03 — Concurrent reads do not error
#[tokio::test]
async fn concurrent_reads_do_not_error() {
    let (tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();
    let note = sample_note(&space.id, "concurrent-note");
    storage.create_note(&note).await.unwrap();

    // Spawn multiple concurrent read tasks sharing the same root path.
    let root = tmp.path().to_path_buf();
    let note_id = note.id.clone();
    let handles: Vec<_> = (0..8)
        .map(|_| {
            let root = root.clone();
            let nid = note_id.clone();
            tokio::spawn(async move {
                let s = FsStorage::new(&root).await.unwrap();
                s.get_note(&nid).await
            })
        })
        .collect();

    for handle in handles {
        let result = handle.await.unwrap();
        assert!(result.unwrap().is_some(), "concurrent read must return Some(note)");
    }
}

/// TC-ST-ERR-04 — note_count in spaces index is accurate after creates and deletes
#[tokio::test]
async fn note_count_accurate_after_create_and_delete() {
    let (_tmp, storage) = make_storage().await;
    let space = sample_space();
    storage.create_space(&space).await.unwrap();

    let note_a = sample_note(&space.id, "count-a");
    let note_b = sample_note(&space.id, "count-b");
    let note_c = sample_note(&space.id, "count-c");
    storage.create_note(&note_a).await.unwrap();
    storage.create_note(&note_b).await.unwrap();
    storage.create_note(&note_c).await.unwrap();
    storage.delete_note(&note_a.id).await.unwrap();

    let index = storage.get_spaces_index().await.unwrap();
    let entry = index
        .spaces
        .iter()
        .find(|e| e.id == space.id)
        .expect("space must be in index");
    assert_eq!(entry.note_count, 2, "note_count must be 2 (3 created, 1 deleted)");
}
