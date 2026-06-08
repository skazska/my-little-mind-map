use serde::{Deserialize, Serialize};
use shared_types::model::{Note, Space};

// ── Model ─────────────────────────────────────────────────────────────────────

/// Full application state managed by the core. @S-ARCH-1
#[derive(Debug, Default, Clone)]
pub struct Model {
    pub screen: Screen,
    pub spaces: Vec<Space>,
    pub current_space: Option<Space>,
    pub notes: Vec<Note>,
    pub current_note: Option<Note>,
    /// All known labels (derived from labels index).
    pub labels: Vec<String>,
    pub search_query: String,
    pub active_view_labels: Vec<String>,
    /// When true, the note list shows notes from all spaces filtered by `active_view_labels`.
    /// Set by `SetActiveView`; cleared by `NavigateBack`, `NavigateOverview`, `ClearView`.
    pub cross_space_view: bool,
    /// When true, the next `NoteLoaded` response should navigate to the editor.
    /// Set by `CreateNote` and `NavigateToNote`; cleared by `NavigateBack` and `NoteLoaded`.
    pub note_opening: bool,
    /// When true, startup should open a new note in the default space after spaces load.
    pub startup_open_default_note: bool,
    /// Whether the currently loaded note has a backing file in storage.
    pub current_note_persisted: bool,
    pub data_folder: Option<String>,
    pub error: Option<String>,
    pub loading: bool,
}

// ── Screen ────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "name", rename_all = "snake_case")]
pub enum Screen {
    #[default]
    Loading,
    FirstLaunch,
    Overview(OverviewTab),
    NoteList,
    NoteEditor,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OverviewTab {
    #[default]
    Spaces,
    Labels,
    Views,
    Recent,
    Search,
}
