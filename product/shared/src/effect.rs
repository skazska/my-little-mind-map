use serde::{Deserialize, Serialize};
use shared_types::ids::{NoteId, SpaceId};
use shared_types::model::{Note, Settings, Space};

// ── Effects ───────────────────────────────────────────────────────────────────

/// Side-effect requests produced by `update()`. Shells execute these and feed
/// the result back as response `Event`s. [S-ARCH-1]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Effect {
    /// Re-render the current view model.
    Render,
    /// Request a storage operation.
    Storage(StorageRequest),
    /// (Reserved) HTTP request for backend features.
    Http(HttpRequest),
}

// ── Storage requests ──────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "op", rename_all = "snake_case")]
pub enum StorageRequest {
    LoadSettings,
    SaveSettings { settings: Settings },
    LoadSpaces,
    CreateSpace { space: Space },
    DeleteSpace { id: SpaceId },
    LoadNotes { space_id: SpaceId },
    LoadNote { id: NoteId },
    SaveNote { note: Note },
    DeleteNote { id: NoteId },
}

// ── HTTP requests (future) ────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HttpRequest {
    pub method: String,
    pub url: String,
    pub body: Option<String>,
}
