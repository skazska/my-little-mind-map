use serde::{Deserialize, Serialize};
use shared_types::ids::{NoteId, SpaceId};
use shared_types::model::{Note, Settings, Space};

// ── Events ────────────────────────────────────────────────────────────────────

/// All events that can be dispatched to the core. [S-ARCH-1]
///
/// Two categories:
/// - *User-initiated* — originate from shell UI interactions.
/// - *Effect responses* — returned by the shell after executing a `StorageRequest`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Event {
    // ── Lifecycle ─────────────────────────────────────────────────────────────
    /// App started; shell provides the configured data-folder path (or None).
    AppStarted {
        data_folder: Option<String>,
    },
    /// User completed first-launch folder selection.
    DataFolderSelected {
        path: String,
    },

    // ── Navigation ────────────────────────────────────────────────────────────
    NavigateOverview {
        tab: OverviewTabRequest,
    },
    NavigateToSpace {
        id: SpaceId,
    },
    NavigateToNote {
        id: NoteId,
    },
    NavigateBack,

    // ── Spaces ────────────────────────────────────────────────────────────────
    CreateSpace {
        name: String,
        description: Option<String>,
    },
    DeleteSpace {
        id: SpaceId,
    },

    // ── Notes ─────────────────────────────────────────────────────────────────
    CreateNote {
        title: String,
        space_id: SpaceId,
        parent_id: Option<NoteId>,
    },
    UpdateNote {
        id: NoteId,
        content: String,
        labels: Vec<String>,
    },
    PublishNote {
        id: NoteId,
    },
    DeleteNote {
        id: NoteId,
    },

    // ── Filtering / search ────────────────────────────────────────────────────
    SetActiveView {
        labels: Vec<String>,
    },
    ClearView,
    SearchChanged {
        query: String,
    },

    // ── Effect responses (shell → core) ───────────────────────────────────────
    SpacesLoaded {
        spaces: Vec<Space>,
    },
    NoteListLoaded {
        space_id: SpaceId,
        note_ids: Vec<NoteId>,
    },
    NoteLoaded {
        note: Note,
    },
    NoteSaved {
        id: NoteId,
    },
    NoteDeleted {
        id: NoteId,
    },
    SpaceCreated {
        space: Space,
    },
    SpaceDeleted {
        id: SpaceId,
    },
    SettingsLoaded {
        settings: Settings,
    },
    EffectError {
        message: String,
    },
}

/// Which tab to show in the Overview screen.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OverviewTabRequest {
    Spaces,
    Labels,
    Views,
    Recent,
    Search,
}
