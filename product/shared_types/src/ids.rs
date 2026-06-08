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
        sorted.dedup(); // @S-DM-V2 each label appears once in the view id
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
    // @S-DM-L1 lowercase alphanumeric + hyphens only; uppercase rejected.
    if !s
        .chars()
        .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
    {
        return Err(IdError::InvalidChars(s.to_string()));
    }
    // Leading or trailing hyphen is not allowed.
    if s.starts_with('-') || s.ends_with('-') {
        return Err(IdError::InvalidChars(s.to_string()));
    }
    // A string of only hyphens is also invalid (already caught above, but explicit).
    if s.chars().all(|c| c == '-') {
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
    let segs: Vec<&str> = s.split('/').collect();
    // A NoteId requires at least <space>/<note> (2 segments). @S-DM-N3
    if segs.len() < 2 {
        return Err(IdError::InvalidChars(s.to_string()));
    }
    for seg in segs {
        validate_label(seg)?;
    }
    Ok(())
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    /// TC-DM-SID-02 — Multi-segment hierarchical ID accepted @S-DM-S3
    #[test]
    fn space_id_segments_root_first() {
        let id = SpaceId::new("sub.parent.root").unwrap();
        assert_eq!(id.segments_root_first(), vec!["root", "parent", "sub"]);
    }

    /// TC-DM-SID-03 — Parent of hierarchical ID @S-DM-S3
    #[test]
    fn space_id_parent() {
        let id = SpaceId::new("sub.parent.root").unwrap();
        assert_eq!(id.parent().unwrap().as_str(), "parent.root");
    }

    /// TC-DM-SID-04 — Parent of root space is None @S-DM-S3
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

    /// TC-DM-NID-02 — Nested note ID accepted @S-DM-N3
    #[test]
    fn note_id_segments() {
        let id = NoteId::new("space1/parent-note/this-note").unwrap();
        assert_eq!(id.name(), "this-note");
        assert_eq!(id.space_segment(), "space1");
        assert_eq!(id.segments(), vec!["space1", "parent-note", "this-note"]);
    }

    /// TC-DM-NID-03 — Parent of nested note @S-DM-N1
    #[test]
    fn note_id_parent() {
        let id = NoteId::new("space1/parent-note/this-note").unwrap();
        assert_eq!(id.parent().unwrap().as_str(), "space1/parent-note");
    }

    /// TC-DM-NID-04 — Parent of root note is None @S-DM-N1
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

    // ── Label validation (TC-DM-L-01 … TC-DM-L-07) ───────────────────────────

    /// TC-DM-L-01 — Valid label accepted @S-DM-L1
    #[test]
    fn label_valid_accepted() {
        assert!(validate_label("rust-learning").is_ok());
        assert!(validate_label("abc").is_ok());
        assert!(validate_label("a1b2").is_ok());
    }

    /// TC-DM-L-02 — Uppercase rejected @S-DM-L1
    #[test]
    fn label_uppercase_rejected() {
        assert!(validate_label("Rust").is_err());
        assert!(validate_label("RUST").is_err());
        assert!(validate_label("rustLearning").is_err());
    }

    /// TC-DM-L-03 — Spaces rejected @S-DM-L1
    #[test]
    fn label_spaces_rejected() {
        assert!(validate_label("my label").is_err());
        assert!(validate_label(" rust").is_err());
    }

    /// TC-DM-L-04 — Special characters rejected @S-DM-L1
    #[test]
    fn label_special_chars_rejected() {
        assert!(validate_label("rust_learning").is_err());
        assert!(validate_label("rust.learning").is_err());
        assert!(validate_label("rust/learning").is_err());
        assert!(validate_label("rust@learning").is_err());
    }

    /// TC-DM-L-05 — Empty string rejected @S-DM-L1
    #[test]
    fn label_empty_rejected() {
        assert!(validate_label("").is_err());
    }

    /// TC-DM-L-06 — Hyphen-only string rejected @S-DM-L1
    #[test]
    fn label_hyphen_only_rejected() {
        assert!(validate_label("-").is_err());
        assert!(validate_label("--").is_err());
    }

    /// TC-DM-L-07 — Leading/trailing hyphen rejected @S-DM-L1
    #[test]
    fn label_leading_trailing_hyphen_rejected() {
        assert!(validate_label("-rust").is_err());
        assert!(validate_label("rust-").is_err());
    }

    // ── SpaceId additions (TC-DM-SID-01, TC-DM-SID-05..07) ──────────────────

    /// TC-DM-SID-01 — Single-segment root space accepted @(S-DM-S2,S-DM-S3)
    #[test]
    fn space_id_single_segment_value() {
        let id = SpaceId::new("my-space").unwrap();
        assert_eq!(id.as_str(), "my-space");
    }

    /// TC-DM-SID-05 — Uppercase segments rejected @S-DM-S2
    #[test]
    fn space_id_uppercase_rejected() {
        assert!(SpaceId::new("MySpace").is_err());
        assert!(SpaceId::new("MY-SPACE").is_err());
    }

    /// TC-DM-SID-06 — Empty segment (leading/trailing dot, consecutive dots) rejected @S-DM-S2
    #[test]
    fn space_id_empty_segment_rejected() {
        assert!(SpaceId::new(".a").is_err());
        assert!(SpaceId::new("a.").is_err());
        assert!(SpaceId::new("a..b").is_err());
    }

    /// TC-DM-SID-07 — Slashes, underscores, and spaces rejected @S-DM-S2
    #[test]
    fn space_id_slash_rejected() {
        assert!(SpaceId::new("my/space").is_err());
        assert!(SpaceId::new("my_space").is_err());
    }

    // ── NoteId additions (TC-DM-NID-01, TC-DM-NID-05..07) ───────────────────

    /// TC-DM-NID-01 — Root note in space accepted @S-DM-N3
    #[test]
    fn note_id_root_note_values() {
        let id = NoteId::new("space1/note1").unwrap();
        assert_eq!(id.as_str(), "space1/note1");
        assert_eq!(id.name(), "note1");
        assert_eq!(id.space_segment(), "space1");
    }

    /// TC-DM-NID-05 — Bare name (no slash) rejected
    #[test]
    fn note_id_bare_name_rejected() {
        assert!(NoteId::new("justnote").is_err());
        assert!(NoteId::new("").is_err());
    }

    /// TC-DM-NID-06 — Uppercase in segment rejected @S-DM-N3
    #[test]
    fn note_id_uppercase_rejected() {
        assert!(NoteId::new("space1/MyNote").is_err());
        assert!(NoteId::new("Space1/note").is_err());
    }

    /// TC-DM-NID-07 — Empty segment (consecutive/trailing slashes) rejected @S-DM-N3
    #[test]
    fn note_id_empty_segment_rejected() {
        assert!(NoteId::new("space1//note").is_err());
        assert!(NoteId::new("space1/note/").is_err());
    }

    // ── ViewId additions (TC-DM-VID-01..05) ─────────────────────────────────

    /// TC-DM-VID-01 — Labels sorted alphabetically @S-DM-V2
    #[test]
    fn view_id_sorts_labels_alphabetically() {
        let id = ViewId::from_labels(&["zebra", "alpha", "middle"]).unwrap();
        assert_eq!(id.as_str(), "alpha-middle-zebra");
    }

    /// TC-DM-VID-02 — Single-label view @S-DM-V2
    #[test]
    fn view_id_single_label() {
        let id = ViewId::from_labels(&["rust"]).unwrap();
        assert_eq!(id.as_str(), "rust");
    }

    /// TC-DM-VID-03 — Duplicate labels de-duplicated @S-DM-V2
    #[test]
    fn view_id_deduplicates_labels() {
        let id = ViewId::from_labels(&["rust", "rust", "learning"]).unwrap();
        assert_eq!(id.as_str(), "learning-rust");
    }

    /// TC-DM-VID-04 — Empty label list rejected @S-DM-V2
    #[test]
    fn view_id_empty_label_list_rejected() {
        assert!(matches!(
            ViewId::from_labels(&[]),
            Err(IdError::EmptyLabels)
        ));
    }

    /// TC-DM-VID-05 — Invalid label in list propagates error @S-DM-L1
    #[test]
    fn view_id_invalid_label_propagates_error() {
        assert!(ViewId::from_labels(&["rust", "Invalid Label"]).is_err());
    }
}
