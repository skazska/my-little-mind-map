use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A topic used for classifying notes (D-004).
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct Topic {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    /// Incremented on each save, used for sync conflict detection (D-006).
    pub version: u64,
}

impl Topic {
    pub fn new(name: String, description: Option<String>) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            name,
            description,
            created_at: now,
            updated_at: now,
            version: 1,
        }
    }
}
