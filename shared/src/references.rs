use uuid::Uuid;

/// Extract internal references from raw markdown content.
///
/// Finds all `[[uuid|display text]]` patterns and returns tuples of (note_id, display_text).
/// Invalid UUIDs are silently skipped.
pub fn extract_references(content: &str) -> Vec<(Uuid, String)> {
    let mut refs = Vec::new();
    let mut search_from = 0;

    while let Some(start) = content[search_from..].find("[[") {
        let abs_start = search_from + start + 2;
        if let Some(end) = content[abs_start..].find("]]") {
            let inner = &content[abs_start..abs_start + end];
            if let Some(pipe) = inner.find('|') {
                let id_str = &inner[..pipe];
                let text = &inner[pipe + 1..];
                if let Ok(id) = Uuid::parse_str(id_str) {
                    refs.push((id, text.to_string()));
                }
            }
            search_from = abs_start + end + 2;
        } else {
            break;
        }
    }

    refs
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_valid_references() {
        let content = "Hello [[550e8400-e29b-41d4-a716-446655440000|My Note]] world";
        let refs = extract_references(content);
        assert_eq!(refs.len(), 1);
        assert_eq!(
            refs[0].0,
            Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap()
        );
        assert_eq!(refs[0].1, "My Note");
    }

    #[test]
    fn extracts_multiple_references() {
        let content = "See [[550e8400-e29b-41d4-a716-446655440000|Note A]] and [[660e8400-e29b-41d4-a716-446655440000|Note B]]";
        let refs = extract_references(content);
        assert_eq!(refs.len(), 2);
        assert_eq!(refs[0].1, "Note A");
        assert_eq!(refs[1].1, "Note B");
    }

    #[test]
    fn skips_invalid_uuid() {
        let content =
            "Bad [[not-a-uuid|Bad Ref]] and good [[550e8400-e29b-41d4-a716-446655440000|Good]]";
        let refs = extract_references(content);
        assert_eq!(refs.len(), 1);
        assert_eq!(refs[0].1, "Good");
    }

    #[test]
    fn empty_content() {
        let refs = extract_references("");
        assert!(refs.is_empty());
    }

    #[test]
    fn no_references() {
        let refs = extract_references("Just regular markdown **bold** and *italic*");
        assert!(refs.is_empty());
    }

    #[test]
    fn incomplete_syntax_ignored() {
        let refs = extract_references("Broken [[550e8400-e29b-41d4-a716-446655440000|text");
        assert!(refs.is_empty());
    }
}
