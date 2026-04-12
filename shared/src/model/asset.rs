use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::common::SourceType;

/// A non-text artifact attached to a note (D-010: must be referenced by a note).
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct Asset {
    pub id: Uuid,
    pub filename: String,
    pub mime_type: String,
    pub size_bytes: u64,
    pub note_id: Uuid,
    pub is_original: bool,
    pub content_hash: Option<String>,
    pub created_at: DateTime<Utc>,
    pub source_type: SourceType,
}

impl Asset {
    pub fn new(
        filename: String,
        mime_type: String,
        size_bytes: u64,
        note_id: Uuid,
        source_type: SourceType,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            filename,
            mime_type,
            size_bytes,
            note_id,
            is_original: true,
            content_hash: None,
            created_at: Utc::now(),
            source_type,
        }
    }
}
