use serde::{Deserialize, Serialize};

/// How a note or asset was originally created.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SourceType {
    Typed,
    Pasted,
    Uploaded,
    Captured,
}

/// The kind of reference between two notes.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum ReferenceType {
    LinksTo,
    Embeds,
}

/// The kind of typed relation between two topics.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum TopicRelationType {
    SubtopicOf,
    RelatedTo,
    Classifies,
}
