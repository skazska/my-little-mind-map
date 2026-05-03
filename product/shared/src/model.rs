use serde::{Deserialize, Serialize};
use shared_types::model::{Note, Space};

// ── Model ─────────────────────────────────────────────────────────────────────

/// Full application state managed by the core. [S-ARCH-1]
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
