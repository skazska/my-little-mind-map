use serde::{Deserialize, Serialize};
use std::fmt;

/// Space identifier: reverse-domain notation, leaf-first.
/// Example: `sub.parent.root` where `root` is the top-level space.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct SpaceId(String);

impl SpaceId {
    pub fn new(s: impl Into<String>) -> Result<Self, IdError> {
        let s = s.into();
        validate_space_id(&s)?;
        Ok(Self(s))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }

    /// Path segments from root to leaf (reversed dot notation).
    pub fn segments_root_first(&self) -> Vec<&str> {
        self.0.split('.').rev().collect()
    }

    /// Parent space (removes the leaf segment).
    pub fn parent(&self) -> Option<SpaceId> {
        let dot = self.0.find('.')?;
        Some(SpaceId(self.0[dot + 1..].to_string()))
    }
}

impl fmt::Display for SpaceId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// Note identifier: slash-separated path, root-first.
/// Example: `space1/parent-note/this-note`
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct NoteId(String);

impl NoteId {
    pub fn new(s: impl Into<String>) -> Result<Self, IdError> {
        let s = s.into();
        validate_note_id(&s)?;
        Ok(Self(s))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }

    pub fn segments(&self) -> Vec<&str> {
        self.0.split('/').collect()
    }

    /// Parent note (removes the last segment).
    /// Returns `None` for top-level notes (only 2 segments: space + note).
    pub fn parent(&self) -> Option<NoteId> {
        if self.segments().len() <= 2 {
            return None;
        }
        let slash = self.0.rfind('/')?;
        Some(NoteId(self.0[..slash].to_string()))
    }

    /// Just the final segment (the note's own name).
    pub fn name(&self) -> &str {
        self.0.split('/').next_back().unwrap_or(&self.0)
    }

    /// Returns the space segment (first path component).
    pub fn space_segment(&self) -> &str {
        self.0.split('/').next().unwrap_or(&self.0)
    }
}

impl fmt::Display for NoteId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// View identifier: labels sorted alphabetically, joined with hyphens.
/// Example: `alpha-middle-zebra`
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ViewId(String);

impl ViewId {
    pub fn from_labels(labels: &[&str]) -> Result<Self, IdError> {
        if labels.is_empty() {
            return Err(IdError::EmptyLabels);
        }
        let mut sorted = labels.to_vec();
        sorted.sort_unstable();
        for l in &sorted {
            validate_label(l)?;
        }
        Ok(Self(sorted.join("-")))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }

    pub fn labels(&self) -> Vec<&str> {
        self.0.split('-').collect()
    }
}

impl fmt::Display for ViewId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

// ── Errors ──────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, thiserror::Error)]
pub enum IdError {
    #[error("ID must not be empty")]
    Empty,
    #[error("ID segment must not be empty")]
    EmptySegment,
    #[error("Labels list must not be empty")]
    EmptyLabels,
    #[error("ID contains invalid characters (only alphanumeric and hyphens): {0}")]
    InvalidChars(String),
}

// ── Validation ───────────────────────────────────────────────────────────────

pub(crate) fn validate_label(s: &str) -> Result<(), IdError> {
    if s.is_empty() {
        return Err(IdError::EmptySegment);
    }
    if !s.chars().all(|c| c.is_ascii_alphanumeric() || c == '-') {
        return Err(IdError::InvalidChars(s.to_string()));
    }
    Ok(())
}

fn validate_space_id(s: &str) -> Result<(), IdError> {
    if s.is_empty() {
        return Err(IdError::Empty);
    }
    for seg in s.split('.') {
        validate_label(seg)?;
    }
    Ok(())
}

fn validate_note_id(s: &str) -> Result<(), IdError> {
    if s.is_empty() {
        return Err(IdError::Empty);
    }
    for seg in s.split('/') {
        validate_label(seg)?;
    }
    Ok(())
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn space_id_segments_root_first() {
        let id = SpaceId::new("sub.parent.root").unwrap();
        assert_eq!(id.segments_root_first(), vec!["root", "parent", "sub"]);
    }

    #[test]
    fn space_id_parent() {
        let id = SpaceId::new("sub.parent.root").unwrap();
        assert_eq!(id.parent().unwrap().as_str(), "parent.root");
    }

    #[test]
    fn space_id_single_segment() {
        let id = SpaceId::new("root").unwrap();
        assert!(id.parent().is_none());
    }

    #[test]
    fn space_id_rejects_invalid() {
        assert!(SpaceId::new("has space").is_err());
        assert!(SpaceId::new("has_underscore").is_err());
        assert!(SpaceId::new("").is_err());
        assert!(SpaceId::new("a..b").is_err());
    }

    #[test]
    fn note_id_segments() {
        let id = NoteId::new("space1/parent-note/this-note").unwrap();
        assert_eq!(id.name(), "this-note");
        assert_eq!(id.space_segment(), "space1");
        assert_eq!(id.segments(), vec!["space1", "parent-note", "this-note"]);
    }

    #[test]
    fn note_id_parent() {
        let id = NoteId::new("space1/parent-note/this-note").unwrap();
        assert_eq!(id.parent().unwrap().as_str(), "space1/parent-note");
    }

    #[test]
    fn note_id_top_level_has_no_parent() {
        let id = NoteId::new("space1/note1").unwrap();
        assert!(id.parent().is_none());
    }

    #[test]
    fn view_id_sorted() {
        let id = ViewId::from_labels(&["zebra", "alpha", "middle"]).unwrap();
        assert_eq!(id.as_str(), "alpha-middle-zebra");
        assert_eq!(id.labels(), vec!["alpha", "middle", "zebra"]);
    }

    #[test]
    fn view_id_empty_labels_rejected() {
        assert!(ViewId::from_labels(&[]).is_err());
    }

    #[test]
    fn view_id_invalid_label_rejected() {
        assert!(ViewId::from_labels(&["valid", "has space"]).is_err());
    }
}
