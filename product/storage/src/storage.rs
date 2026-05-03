use async_trait::async_trait;
use shared_types::{
    ids::{NoteId, SpaceId},
    model::{Note, Settings, Space},
};

use crate::{
    indexes::{DefinitionsIndex, LabelsIndex, ReferencesIndex, SpacesIndex},
    Result,
};

/// Async storage abstraction for notes, spaces, and derived indexes.
///
/// Async-first so both native (`FsStorage`) and browser (`OpfsStorage`) can
/// implement the same interface. [S-ST-LS1]
#[async_trait]
pub trait Storage: Send + Sync {
    // ── Spaces ────────────────────────────────────────────────────────────────

    async fn create_space(&self, space: &Space) -> Result<()>;
    async fn get_space(&self, id: &SpaceId) -> Result<Option<Space>>;
    async fn list_spaces(&self) -> Result<Vec<Space>>;
    async fn delete_space(&self, id: &SpaceId) -> Result<()>;

    // ── Notes ─────────────────────────────────────────────────────────────────

    async fn create_note(&self, note: &Note) -> Result<()>;
    async fn get_note(&self, id: &NoteId) -> Result<Option<Note>>;
    /// List all note IDs directly inside a space (non-recursive).
    async fn list_notes(&self, space_id: &SpaceId) -> Result<Vec<NoteId>>;
    async fn update_note(&self, note: &Note) -> Result<()>;
    async fn delete_note(&self, id: &NoteId) -> Result<()>;

    // ── Indexes ───────────────────────────────────────────────────────────────

    async fn get_spaces_index(&self) -> Result<SpacesIndex>;
    async fn get_labels_index(&self) -> Result<LabelsIndex>;
    async fn get_references_index(&self) -> Result<ReferencesIndex>;
    async fn get_definitions_index(&self) -> Result<DefinitionsIndex>;

    // ── Settings ──────────────────────────────────────────────────────────────

    async fn get_settings(&self) -> Result<Settings>;
    async fn update_settings(&self, settings: &Settings) -> Result<()>;
}
