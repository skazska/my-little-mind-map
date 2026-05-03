use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::ids::{NoteId, SpaceId};
use crate::model::{Label, NoteMetadata, NoteReference, NoteReferenceKind};

// ── Serialised form stored in .md front matter ────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
struct RawFrontMatter {
    uuid: Uuid,
    title: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    space: Option<String>,
    /// Space-separated labels string, e.g. `"rust learning"`. [S-DM-N5]
    #[serde(default)]
    labels: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    references: Vec<RawReference>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
    #[serde(default)]
    draft: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct RawReference {
    kind: String,
    target: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    block_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    source_block_id: Option<String>,
}

// ── Public error type ─────────────────────────────────────────────────────────

#[derive(Debug, thiserror::Error)]
pub enum FrontMatterError {
    #[error("missing or malformed front-matter delimiters (`---`)")]
    NoFrontMatter,
    #[error("YAML error: {0}")]
    Yaml(#[from] serde_yaml::Error),
    #[error("invalid ID: {0}")]
    InvalidId(#[from] crate::ids::IdError),
}

// ── Public API ────────────────────────────────────────────────────────────────

/// Parse a note file that begins with YAML front matter delimited by `---`.
/// Returns `(metadata, markdown_body)`.
pub fn parse_note_content(raw: &str) -> Result<(NoteMetadata, String), FrontMatterError> {
    let (fm_str, body) = split_front_matter(raw)?;
    let raw_fm: RawFrontMatter = serde_yaml::from_str(fm_str)?;
    let metadata = raw_fm_to_metadata(raw_fm)?;
    Ok((metadata, body.trim_start().to_string()))
}

/// Serialise a note back to a markdown file with YAML front matter.
pub fn serialize_note_content(
    metadata: &NoteMetadata,
    content: &str,
) -> Result<String, FrontMatterError> {
    let raw_fm = metadata_to_raw_fm(metadata);
    let fm_str = serde_yaml::to_string(&raw_fm)?;
    Ok(format!("---\n{}---\n\n{}", fm_str, content))
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/// Split `---\n<yaml>\n---\n<body>` into `(yaml_str, body_str)`.
fn split_front_matter(raw: &str) -> Result<(&str, &str), FrontMatterError> {
    let raw = raw.trim_start();
    if !raw.starts_with("---") {
        return Err(FrontMatterError::NoFrontMatter);
    }
    // Skip the opening `---` plus any trailing whitespace on that line.
    let after_open = raw[3..].trim_start_matches(['\r', '\n', ' ', '\t']);
    // Find the closing `---` on its own line.
    if let Some(end) = after_open.find("\n---") {
        let fm_str = &after_open[..end];
        let body = &after_open[end + 4..]; // skip `\n---`
        Ok((fm_str, body))
    } else {
        Err(FrontMatterError::NoFrontMatter)
    }
}

fn raw_fm_to_metadata(fm: RawFrontMatter) -> Result<NoteMetadata, FrontMatterError> {
    let space = fm
        .space
        .filter(|s| !s.is_empty())
        .map(SpaceId::new)
        .transpose()?;

    let labels = fm
        .labels
        .split_whitespace()
        .map(|s| Label(s.to_string()))
        .collect();

    let references = fm
        .references
        .into_iter()
        .map(raw_ref_to_note_ref)
        .collect::<Result<Vec<_>, _>>()?;

    Ok(NoteMetadata {
        uuid: fm.uuid,
        title: fm.title,
        space,
        labels,
        references,
        created_at: fm.created_at,
        updated_at: fm.updated_at,
        draft: fm.draft,
    })
}

fn metadata_to_raw_fm(m: &NoteMetadata) -> RawFrontMatter {
    let labels = m
        .labels
        .iter()
        .map(|l| l.0.as_str())
        .collect::<Vec<_>>()
        .join(" ");

    let references = m.references.iter().map(note_ref_to_raw).collect();

    RawFrontMatter {
        uuid: m.uuid,
        title: m.title.clone(),
        space: m.space.as_ref().map(|s| s.to_string()),
        labels,
        references,
        created_at: m.created_at,
        updated_at: m.updated_at,
        draft: m.draft,
    }
}

fn note_ref_to_raw(r: &NoteReference) -> RawReference {
    use NoteReferenceKind::*;
    let (kind, target) = match &r.target {
        Note { id } => ("note", id.to_string()),
        Space { id } => ("space", id.to_string()),
        View { id } => ("view", id.to_string()),
        File { path } => ("file", path.clone()),
        External { url } => ("external", url.clone()),
    };
    RawReference {
        kind: kind.to_string(),
        target,
        block_id: r.block_id.clone(),
        source_block_id: r.source_block_id.clone(),
    }
}

fn raw_ref_to_note_ref(r: RawReference) -> Result<NoteReference, FrontMatterError> {
    use crate::ids::ViewId;
    use NoteReferenceKind::*;

    let target = match r.kind.as_str() {
        "note" => Note {
            id: NoteId::new(&r.target)?,
        },
        "space" => Space {
            id: SpaceId::new(&r.target)?,
        },
        "view" => {
            let parts: Vec<&str> = r.target.split('-').collect();
            View {
                id: ViewId::from_labels(&parts)?,
            }
        }
        "file" => File { path: r.target },
        _ => External { url: r.target },
    };
    Ok(NoteReference {
        target,
        block_id: r.block_id,
        source_block_id: r.source_block_id,
    })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE: &str = r#"---
uuid: 550e8400-e29b-41d4-a716-446655440000
title: my-note
space: test-space
labels: rust learning
draft: false
created_at: "2024-01-01T00:00:00Z"
updated_at: "2024-01-01T00:00:00Z"
---

# my-note

Some content here."#;

    #[test]
    fn parse_basic() {
        let (meta, body) = parse_note_content(SAMPLE).unwrap();
        assert_eq!(meta.title, "my-note");
        assert_eq!(meta.labels.len(), 2);
        assert_eq!(meta.labels[0].0, "rust");
        assert_eq!(meta.labels[1].0, "learning");
        assert_eq!(meta.space.as_ref().unwrap().as_str(), "test-space");
        assert!(!meta.draft);
        assert!(body.starts_with("# my-note"));
    }

    #[test]
    fn round_trip() {
        let (meta, body) = parse_note_content(SAMPLE).unwrap();
        let serialized = serialize_note_content(&meta, &body).unwrap();
        let (meta2, body2) = parse_note_content(&serialized).unwrap();
        assert_eq!(meta.uuid, meta2.uuid);
        assert_eq!(meta.title, meta2.title);
        assert_eq!(meta.labels, meta2.labels);
        assert_eq!(body, body2);
    }

    #[test]
    fn missing_front_matter_errors() {
        let result = parse_note_content("# just content\nno front matter");
        assert!(matches!(result, Err(FrontMatterError::NoFrontMatter)));
    }

    #[test]
    fn with_reference() {
        let raw = r#"---
uuid: 550e8400-e29b-41d4-a716-446655440001
title: linking-note
labels: ""
draft: true
created_at: "2024-01-01T00:00:00Z"
updated_at: "2024-01-01T00:00:00Z"
references:
  - kind: note
    target: "space1/target-note"
---

Content."#;
        let (meta, _body) = parse_note_content(raw).unwrap();
        assert_eq!(meta.references.len(), 1);
        assert!(
            matches!(&meta.references[0].target, NoteReferenceKind::Note { id } if id.as_str() == "space1/target-note")
        );
    }
}
