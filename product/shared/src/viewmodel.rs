use serde::{Deserialize, Serialize};
use shared_types::model::{Note, Space};

use crate::model::OverviewTab;

// ── ViewModels ────────────────────────────────────────────────────────────────

/// Serialisable view data sent to the shell for rendering. [S-ARCH-1]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "screen", rename_all = "snake_case")]
pub enum ViewModel {
    Loading,
    FirstLaunch,
    Overview(OverviewViewModel),
    NoteList(NoteListViewModel),
    NoteEditor(NoteEditorViewModel),
    Error { message: String },
}

// ── Overview ──────────────────────────────────────────────────────────────────

/// [S-UX-SA1, UX-OV1]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OverviewViewModel {
    pub active_tab: OverviewTab,
    pub spaces: Vec<SpaceSummary>,
    pub labels: Vec<LabelSummary>,
    pub search_query: String,
    pub data_folder: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpaceSummary {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub labels: Vec<String>,
    pub note_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LabelSummary {
    pub label: String,
    pub note_count: usize,
}

// ── Note list ─────────────────────────────────────────────────────────────────

/// [S-UX-NLV1, S-UX-NLV2]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteListViewModel {
    pub space_id: String,
    pub space_name: String,
    pub notes: Vec<NoteListItem>,
    pub search_query: String,
    pub active_view_labels: Vec<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteListItem {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub labels: Vec<String>,
    pub draft: bool,
    pub updated_at: String,
}

// ── Note editor ───────────────────────────────────────────────────────────────

/// [S-UX-NE1, S-UX-NE2]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteEditorViewModel {
    pub id: String,
    pub title: String,
    pub content: String,
    pub labels: Vec<String>,
    pub space_id: Option<String>,
    pub draft: bool,
    pub uuid: String,
    pub created_at: String,
    pub updated_at: String,
    pub error: Option<String>,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

impl From<&Note> for NoteListItem {
    fn from(n: &Note) -> Self {
        let description = n
            .content
            .lines()
            .find(|l| !l.trim().is_empty() && !l.starts_with('#'))
            .map(|l| l.trim().to_string());

        NoteListItem {
            id: n.id.to_string(),
            title: n.metadata.title.clone(),
            description,
            labels: n.metadata.labels.iter().map(|l| l.0.clone()).collect(),
            draft: n.metadata.draft,
            updated_at: n.metadata.updated_at.to_rfc3339(),
        }
    }
}

impl From<&Note> for NoteEditorViewModel {
    fn from(n: &Note) -> Self {
        NoteEditorViewModel {
            id: n.id.to_string(),
            title: n.metadata.title.clone(),
            content: n.content.clone(),
            labels: n.metadata.labels.iter().map(|l| l.0.clone()).collect(),
            space_id: n.metadata.space.as_ref().map(|s| s.to_string()),
            draft: n.metadata.draft,
            uuid: n.metadata.uuid.to_string(),
            created_at: n.metadata.created_at.to_rfc3339(),
            updated_at: n.metadata.updated_at.to_rfc3339(),
            error: None,
        }
    }
}

impl From<&Space> for SpaceSummary {
    fn from(s: &Space) -> Self {
        SpaceSummary {
            id: s.id.to_string(),
            name: s.name.clone(),
            description: s.description.clone(),
            labels: s.labels.iter().map(|l| l.0.clone()).collect(),
            note_count: 0, // populated from index when available
        }
    }
}
