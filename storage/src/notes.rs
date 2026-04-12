use serde::{Deserialize, Serialize};
use shared::model::{Asset, Note, SourceType};
use uuid::Uuid;

use crate::{Result, StorageError, StorageHandle};

/// The per-note metadata stored in `meta.json`.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NoteMeta {
    pub id: Uuid,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
    pub source_type: SourceType,
    pub version: u64,
    /// Opaque AST (Phase 1); real mdast in Phase 2.
    #[serde(default)]
    pub content_ast: serde_json::Value,
    #[serde(default)]
    pub assets: Vec<Asset>,
}

/// A lightweight summary of a note for listings.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NoteSummary {
    pub id: Uuid,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
    pub source_type: SourceType,
    pub version: u64,
}

impl From<&NoteMeta> for NoteSummary {
    fn from(meta: &NoteMeta) -> Self {
        Self {
            id: meta.id,
            title: meta.title.clone(),
            created_at: meta.created_at.clone(),
            updated_at: meta.updated_at.clone(),
            source_type: meta.source_type.clone(),
            version: meta.version,
        }
    }
}

fn note_dir(handle: &StorageHandle, id: &Uuid) -> std::path::PathBuf {
    handle.notes_dir().join(id.to_string())
}

fn meta_path(handle: &StorageHandle, id: &Uuid) -> std::path::PathBuf {
    note_dir(handle, id).join("meta.json")
}

fn content_path(handle: &StorageHandle, id: &Uuid) -> std::path::PathBuf {
    note_dir(handle, id).join("content.md")
}

pub fn create_note(handle: &StorageHandle, note: &Note) -> Result<()> {
    let dir = note_dir(handle, &note.id);
    if dir.exists() {
        return Err(StorageError::AlreadyExists(format!(
            "Note {} already exists",
            note.id
        )));
    }
    std::fs::create_dir_all(dir.join("assets"))?;

    let meta = NoteMeta {
        id: note.id,
        title: note.title.clone(),
        created_at: note.created_at.to_rfc3339(),
        updated_at: note.updated_at.to_rfc3339(),
        source_type: note.source_type.clone(),
        version: note.version,
        content_ast: note.content_ast.clone(),
        assets: vec![],
    };
    let file = std::fs::File::create(meta_path(handle, &note.id))?;
    serde_json::to_writer_pretty(file, &meta)?;

    std::fs::write(content_path(handle, &note.id), &note.content_raw)?;

    Ok(())
}

pub fn read_note(handle: &StorageHandle, id: &Uuid) -> Result<Note> {
    let mp = meta_path(handle, id);
    if !mp.exists() {
        return Err(StorageError::NotFound(format!("Note {id} not found")));
    }
    let meta: NoteMeta = serde_json::from_reader(std::fs::File::open(mp)?)?;
    let content_raw = std::fs::read_to_string(content_path(handle, id))?;

    Ok(Note {
        id: meta.id,
        title: meta.title,
        content_ast: meta.content_ast,
        content_raw,
        created_at: meta
            .created_at
            .parse()
            .map_err(|e| StorageError::InvalidData(format!("Bad created_at: {e}")))?,
        updated_at: meta
            .updated_at
            .parse()
            .map_err(|e| StorageError::InvalidData(format!("Bad updated_at: {e}")))?,
        source_type: meta.source_type,
        version: meta.version,
    })
}

pub fn update_note(handle: &StorageHandle, note: &Note) -> Result<()> {
    let mp = meta_path(handle, &note.id);
    if !mp.exists() {
        return Err(StorageError::NotFound(format!(
            "Note {} not found",
            note.id
        )));
    }

    let meta = NoteMeta {
        id: note.id,
        title: note.title.clone(),
        created_at: note.created_at.to_rfc3339(),
        updated_at: note.updated_at.to_rfc3339(),
        source_type: note.source_type.clone(),
        version: note.version,
        content_ast: note.content_ast.clone(),
        assets: {
            // Preserve existing assets
            let existing: NoteMeta = serde_json::from_reader(std::fs::File::open(&mp)?)?;
            existing.assets
        },
    };
    let file = std::fs::File::create(mp)?;
    serde_json::to_writer_pretty(file, &meta)?;

    std::fs::write(content_path(handle, &note.id), &note.content_raw)?;

    Ok(())
}

pub fn delete_note(handle: &StorageHandle, id: &Uuid) -> Result<()> {
    let dir = note_dir(handle, id);
    if !dir.exists() {
        return Err(StorageError::NotFound(format!("Note {id} not found")));
    }
    std::fs::remove_dir_all(dir)?;
    Ok(())
}

pub fn list_notes(handle: &StorageHandle) -> Result<Vec<NoteSummary>> {
    let notes_dir = handle.notes_dir();
    if !notes_dir.exists() {
        return Ok(vec![]);
    }
    let mut summaries = Vec::new();
    for entry in std::fs::read_dir(notes_dir)? {
        let entry = entry?;
        if entry.file_type()?.is_dir() {
            let meta_file = entry.path().join("meta.json");
            if meta_file.exists() {
                let meta: NoteMeta = serde_json::from_reader(std::fs::File::open(meta_file)?)?;
                summaries.push(NoteSummary::from(&meta));
            }
        }
    }
    summaries.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(summaries)
}

/// Load all notes with full content (for syncing model from storage).
pub fn list_full_notes(handle: &StorageHandle) -> Result<Vec<Note>> {
    let notes_dir = handle.notes_dir();
    if !notes_dir.exists() {
        return Ok(vec![]);
    }
    let mut notes = Vec::new();
    for entry in std::fs::read_dir(notes_dir)? {
        let entry = entry?;
        if entry.file_type()?.is_dir()
            && let Ok(id) = entry.file_name().to_string_lossy().parse::<Uuid>()
        {
            match read_note(handle, &id) {
                Ok(note) => notes.push(note),
                Err(StorageError::NotFound(_)) => {} // skip orphaned dirs
                Err(e) => return Err(e),
            }
        }
    }
    notes.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(notes)
}

pub fn read_note_meta(handle: &StorageHandle, id: &Uuid) -> Result<NoteMeta> {
    let mp = meta_path(handle, id);
    if !mp.exists() {
        return Err(StorageError::NotFound(format!("Note {id} not found")));
    }
    let meta: NoteMeta = serde_json::from_reader(std::fs::File::open(mp)?)?;
    Ok(meta)
}

pub fn update_note_meta(handle: &StorageHandle, meta: &NoteMeta) -> Result<()> {
    let mp = meta_path(handle, &meta.id);
    if !mp.exists() {
        return Err(StorageError::NotFound(format!(
            "Note {} not found",
            meta.id
        )));
    }
    let file = std::fs::File::create(mp)?;
    serde_json::to_writer_pretty(file, meta)?;
    Ok(())
}
