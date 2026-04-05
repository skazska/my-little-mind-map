use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::common::{ReferenceType, TopicRelationType};

/// A note classified under a topic (D-011: every note needs ≥1).
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct Classification {
    pub note_id: Uuid,
    pub topic_id: Uuid,
    pub created_at: DateTime<Utc>,
}

impl Classification {
    pub fn new(note_id: Uuid, topic_id: Uuid) -> Self {
        Self {
            note_id,
            topic_id,
            created_at: Utc::now(),
        }
    }
}

/// A reference from one note to another (D-009).
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct NoteReference {
    pub source_note_id: Uuid,
    pub target_note_id: Uuid,
    pub reference_type: ReferenceType,
    pub broken: bool,
    pub created_at: DateTime<Utc>,
}

impl NoteReference {
    pub fn new(source_note_id: Uuid, target_note_id: Uuid, reference_type: ReferenceType) -> Self {
        Self {
            source_note_id,
            target_note_id,
            reference_type,
            broken: false,
            created_at: Utc::now(),
        }
    }
}

/// A typed relation between two topics (D-004).
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct TopicRelation {
    pub source_topic_id: Uuid,
    pub target_topic_id: Uuid,
    pub relation_type: TopicRelationType,
    pub created_at: DateTime<Utc>,
}

impl TopicRelation {
    pub fn new(
        source_topic_id: Uuid,
        target_topic_id: Uuid,
        relation_type: TopicRelationType,
    ) -> Self {
        Self {
            source_topic_id,
            target_topic_id,
            relation_type,
            created_at: Utc::now(),
        }
    }
}
