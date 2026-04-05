use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::common::SourceType;

/// A note — the keystone artifact type (D-010).
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Note {
    pub id: Uuid,
    pub title: String,
    /// Structured AST representation of the markdown content.
    /// Stored as opaque JSON in Phase 1; real mdast comes in Phase 2.
    pub content_ast: serde_json::Value,
    /// Raw markdown string for round-trip fidelity.
    pub content_raw: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub source_type: SourceType,
    /// Incremented on each save, used for sync conflict detection (D-006).
    pub version: u64,
}

impl Note {
    pub fn new(title: String, content_raw: String, source_type: SourceType) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            title,
            content_ast: serde_json::Value::Null,
            content_raw,
            created_at: now,
            updated_at: now,
            source_type,
            version: 1,
        }
    }
}
