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
