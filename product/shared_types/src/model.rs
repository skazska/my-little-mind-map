use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::ids::{NoteId, SpaceId, ViewId};

/// A label: single lowercase alphanumeric+hyphens word. [S-DM-L1]
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Label(pub String);

/// A space: hierarchical container for notes. [S-DM-S1]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Space {
    pub id: SpaceId,
    pub name: String,
    pub description: Option<String>,
    pub labels: Vec<Label>,
    /// None for root-level spaces.
    pub parent_id: Option<SpaceId>,
}

/// A view: a set of labels defining a perspective filter. [S-DM-V1]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct View {
    pub id: ViewId,
    pub labels: Vec<Label>,
}

/// Kind of artifact a note reference points to. [S-DM-NR3]
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum NoteReferenceKind {
    Note { id: NoteId },
    Space { id: SpaceId },
    View { id: ViewId },
    File { path: String },
    External { url: String },
}

/// A reference from a note to another artifact. [S-DM-NR1]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteReference {
    pub target: NoteReferenceKind,
    /// Block-level anchor within the target note. [S-DM-NR5]
    pub block_id: Option<String>,
    /// Block in the *source* note where this reference appears.
    pub source_block_id: Option<String>,
}

/// A term definition extracted from note content. [S-DM-ND1]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteDefinition {
    pub term: String,
    pub definition: String,
    pub note_id: NoteId,
    pub block_id: Option<String>,
}

/// Front-matter metadata for a note. [S-DM-N5]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteMetadata {
    pub uuid: Uuid,
    pub title: String,
    /// Space this note belongs to (set on root notes; derived from storage path).
    pub space: Option<SpaceId>,
    pub labels: Vec<Label>,
    pub references: Vec<NoteReference>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub draft: bool,
}

impl NoteMetadata {
    pub fn new(title: impl Into<String>, space: Option<SpaceId>) -> Self {
        let now = Utc::now();
        NoteMetadata {
            uuid: Uuid::new_v4(),
            title: title.into(),
            space,
            labels: Vec::new(),
            references: Vec::new(),
            created_at: now,
            updated_at: now,
            draft: true,
        }
    }

    pub fn touch(&mut self) {
        self.updated_at = Utc::now();
    }
}

/// A note: primary content unit. [S-DM-N1]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    /// Full path id, e.g. `space1/parent-note/this-note`. [S-DM-N3]
    pub id: NoteId,
    pub metadata: NoteMetadata,
    /// Markdown body (front matter excluded). [S-DM-N2]
    pub content: String,
    /// Parent note id, None for space-root notes.
    pub parent_id: Option<NoteId>,
}

/// Application settings stored in `settings.json`. [S-CFG-2]
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Settings {
    /// Absolute path to the current data folder. [S-CFG-1]
    pub data_folder: Option<String>,
    pub default_space: Option<SpaceId>,
    pub theme: Option<String>,
}
