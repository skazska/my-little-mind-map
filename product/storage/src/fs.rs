use std::path::{Path, PathBuf};

use async_trait::async_trait;
use serde::{de::DeserializeOwned, Serialize};
use shared_types::{
    ids::{NoteId, SpaceId},
    model::{Note, NoteReferenceKind, Settings, Space},
    parse_note_content, serialize_note_content,
};
use tokio::fs;

use crate::{
    error::StorageError,
    indexes::{DefinitionsIndex, LabelsIndex, ReferencesIndex, SpaceEntry, SpacesIndex},
    storage::Storage,
    Result,
};

// ── FsStorage ─────────────────────────────────────────────────────────────────

/// File-system backed storage using the folder-note layout. [S-ST-LS2, S-ST-DM4]
///
/// Layout under `root/`:
/// ```text
/// root/
///   spaces.json
///   labels.json
///   references.json
///   definitions.json
///   settings.json
///   history.json
///   labels/
///     views.json
///   spaces/
///     <space-seg>/
///       <note-name>.md
///       <note-name>/        ← folder for subnotes / drafts
///         <subnote>.md
///         draft.md
/// ```
pub struct FsStorage {
    root: PathBuf,
}

impl FsStorage {
    /// Initialise storage at `root`, creating required directories if absent.
    pub async fn new(root: impl AsRef<Path>) -> Result<Self> {
        let root = root.as_ref().to_path_buf();
        fs::create_dir_all(&root).await?;
        fs::create_dir_all(root.join("spaces")).await?;
        fs::create_dir_all(root.join("labels")).await?;
        Ok(Self { root })
    }

    // ── Path helpers ──────────────────────────────────────────────────────────

    /// `space1/note1/subnote` → `{root}/spaces/space1/note1/subnote.md`
    fn note_path(&self, id: &NoteId) -> PathBuf {
        let mut path = self.root.join("spaces");
        for seg in id.segments() {
            path.push(seg);
        }
        path.with_extension("md")
    }

    /// Returns `{root}/spaces/<root-seg>/<rest...>/` (directory for the space).
    /// SpaceId `sub.parent.root` → `{root}/spaces/root/parent/sub/`
    fn space_dir(&self, id: &SpaceId) -> PathBuf {
        let mut path = self.root.join("spaces");
        for seg in id.segments_root_first() {
            path.push(seg);
        }
        path
    }

    // ── Index helpers ─────────────────────────────────────────────────────────

    async fn read_index<T: DeserializeOwned + Default>(&self, name: &str) -> Result<T> {
        let path = self.root.join(name);
        if !path.exists() {
            return Ok(T::default());
        }
        let text = fs::read_to_string(&path).await?;
        Ok(serde_json::from_str(&text)?)
    }

    async fn write_index<T: Serialize>(&self, name: &str, data: &T) -> Result<()> {
        let path = self.root.join(name);
        let text = serde_json::to_string_pretty(data)?;
        fs::write(&path, text).await?;
        Ok(())
    }

    // ── Index sync on note save ───────────────────────────────────────────────

    /// Update `labels.json` and `references.json` after a note is created/updated.
    async fn sync_indexes_for_note(&self, note: &Note) -> Result<()> {
        // --- Labels ---
        let mut labels: LabelsIndex = self.read_index("labels.json").await?;
        labels.remove_note(&note.id);
        for label in &note.metadata.labels {
            labels.add(label, &note.id);
        }
        self.write_index("labels.json", &labels).await?;

        // --- References ---
        let mut refs: ReferencesIndex = self.read_index("references.json").await?;
        refs.remove_source(&note.id);
        for r in &note.metadata.references {
            let target = match &r.target {
                NoteReferenceKind::Note { id } => id.to_string(),
                NoteReferenceKind::Space { id } => id.to_string(),
                NoteReferenceKind::View { id } => id.to_string(),
                NoteReferenceKind::File { path } => path.clone(),
                NoteReferenceKind::External { url } => url.clone(),
            };
            refs.add(
                &note.id,
                &target,
                r.source_block_id.as_deref(),
                r.block_id.as_deref(),
            );
        }
        self.write_index("references.json", &refs).await?;

        Ok(())
    }

    /// Remove a note's contributions from all indexes.
    async fn remove_note_from_indexes(&self, id: &NoteId) -> Result<()> {
        let mut labels: LabelsIndex = self.read_index("labels.json").await?;
        labels.remove_note(id);
        self.write_index("labels.json", &labels).await?;

        let mut refs: ReferencesIndex = self.read_index("references.json").await?;
        refs.remove_source(id);
        self.write_index("references.json", &refs).await?;

        let mut defs: DefinitionsIndex = self.read_index("definitions.json").await?;
        defs.remove_note(id);
        self.write_index("definitions.json", &defs).await?;

        Ok(())
    }
}

// ── Storage impl ──────────────────────────────────────────────────────────────

#[async_trait]
impl Storage for FsStorage {
    // ── Spaces ────────────────────────────────────────────────────────────────

    async fn create_space(&self, space: &Space) -> Result<()> {
        let dir = self.space_dir(&space.id);
        fs::create_dir_all(&dir).await?;

        let mut index: SpacesIndex = self.read_index("spaces.json").await?;
        index.upsert(SpaceEntry {
            id: space.id.clone(),
            name: space.name.clone(),
            description: space.description.clone(),
            labels: space.labels.clone(),
            parent_id: space.parent_id.clone(),
            child_ids: vec![],
            note_count: 0,
        });
        self.write_index("spaces.json", &index).await?;
        Ok(())
    }

    async fn get_space(&self, id: &SpaceId) -> Result<Option<Space>> {
        let index: SpacesIndex = self.read_index("spaces.json").await?;
        Ok(index.get(id).map(|e| Space {
            id: e.id.clone(),
            name: e.name.clone(),
            description: e.description.clone(),
            labels: e.labels.clone(),
            parent_id: e.parent_id.clone(),
        }))
    }

    async fn list_spaces(&self) -> Result<Vec<Space>> {
        let index: SpacesIndex = self.read_index("spaces.json").await?;
        Ok(index
            .spaces
            .into_iter()
            .map(|e| Space {
                id: e.id,
                name: e.name,
                description: e.description,
                labels: e.labels,
                parent_id: e.parent_id,
            })
            .collect())
    }

    async fn delete_space(&self, id: &SpaceId) -> Result<()> {
        let dir = self.space_dir(id);
        if dir.exists() {
            fs::remove_dir_all(&dir).await?;
        }
        let mut index: SpacesIndex = self.read_index("spaces.json").await?;
        index.remove(id);
        self.write_index("spaces.json", &index).await?;
        Ok(())
    }

    // ── Notes ─────────────────────────────────────────────────────────────────

    async fn create_note(&self, note: &Note) -> Result<()> {
        let path = self.note_path(&note.id);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).await?;
        }
        let content = serialize_note_content(&note.metadata, &note.content)?;
        fs::write(&path, content).await?;

        // Bump note_count in spaces index.
        let space_seg = note.id.space_segment();
        if let Ok(space_id) = SpaceId::new(space_seg) {
            let mut idx: SpacesIndex = self.read_index("spaces.json").await?;
            if let Some(entry) = idx.spaces.iter_mut().find(|e| e.id == space_id) {
                entry.note_count += 1;
            }
            self.write_index("spaces.json", &idx).await?;
        }

        self.sync_indexes_for_note(note).await?;
        Ok(())
    }

    async fn get_note(&self, id: &NoteId) -> Result<Option<Note>> {
        let path = self.note_path(id);
        if !path.exists() {
            return Ok(None);
        }
        let raw = fs::read_to_string(&path).await?;
        let (metadata, content) = parse_note_content(&raw)?;

        let parent_id = id.parent();
        Ok(Some(Note {
            id: id.clone(),
            metadata,
            content,
            parent_id,
        }))
    }

    async fn list_notes(&self, space_id: &SpaceId) -> Result<Vec<NoteId>> {
        let dir = self.space_dir(space_id);
        if !dir.exists() {
            return Ok(vec![]);
        }
        let mut ids = Vec::new();
        let mut entries = fs::read_dir(&dir).await?;
        while let Some(entry) = entries.next_entry().await? {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("md") {
                if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                    let id_str = format!("{}/{}", space_id.segments_root_first().join("/"), stem);
                    if let Ok(note_id) = NoteId::new(&id_str) {
                        ids.push(note_id);
                    }
                }
            }
        }
        Ok(ids)
    }

    async fn update_note(&self, note: &Note) -> Result<()> {
        let path = self.note_path(&note.id);
        if !path.exists() {
            return Err(StorageError::NotFound(note.id.to_string()));
        }
        let content = serialize_note_content(&note.metadata, &note.content)?;
        fs::write(&path, content).await?;
        self.sync_indexes_for_note(note).await?;
        Ok(())
    }

    async fn delete_note(&self, id: &NoteId) -> Result<()> {
        let path = self.note_path(id);
        if path.exists() {
            fs::remove_file(&path).await?;
        }
        // Remove the companion folder (subnotes) if present.
        let folder = path.with_extension("");
        if folder.exists() {
            fs::remove_dir_all(&folder).await?;
        }
        self.remove_note_from_indexes(id).await?;
        Ok(())
    }

    // ── Indexes ───────────────────────────────────────────────────────────────

    async fn get_spaces_index(&self) -> Result<SpacesIndex> {
        self.read_index("spaces.json").await
    }

    async fn get_labels_index(&self) -> Result<LabelsIndex> {
        self.read_index("labels.json").await
    }

    async fn get_references_index(&self) -> Result<ReferencesIndex> {
        self.read_index("references.json").await
    }

    async fn get_definitions_index(&self) -> Result<DefinitionsIndex> {
        self.read_index("definitions.json").await
    }

    // ── Settings ──────────────────────────────────────────────────────────────

    async fn get_settings(&self) -> Result<Settings> {
        self.read_index("settings.json").await
    }

    async fn update_settings(&self, settings: &Settings) -> Result<()> {
        self.write_index("settings.json", settings).await
    }
}
