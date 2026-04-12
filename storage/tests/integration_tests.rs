#[cfg(test)]
mod model_serde {
    use shared::model::*;
    use uuid::Uuid;

    #[test]
    fn note_serde_round_trip() {
        let note = Note::new(
            "Test Note".into(),
            "# Hello\nWorld".into(),
            SourceType::Typed,
        );
        let json = serde_json::to_string(&note).unwrap();
        let deserialized: Note = serde_json::from_str(&json).unwrap();
        assert_eq!(note, deserialized);
    }

    #[test]
    fn topic_serde_round_trip() {
        let topic = Topic::new("Rust".into(), Some("Programming language".into()));
        let json = serde_json::to_string(&topic).unwrap();
        let deserialized: Topic = serde_json::from_str(&json).unwrap();
        assert_eq!(topic, deserialized);
    }

    #[test]
    fn asset_serde_round_trip() {
        let asset = Asset::new(
            "image.png".into(),
            "image/png".into(),
            1024,
            Uuid::new_v4(),
            SourceType::Uploaded,
        );
        let json = serde_json::to_string(&asset).unwrap();
        let deserialized: Asset = serde_json::from_str(&json).unwrap();
        assert_eq!(asset, deserialized);
    }

    #[test]
    fn classification_serde_round_trip() {
        let c = Classification::new(Uuid::new_v4(), Uuid::new_v4());
        let json = serde_json::to_string(&c).unwrap();
        let deserialized: Classification = serde_json::from_str(&json).unwrap();
        assert_eq!(c, deserialized);
    }

    #[test]
    fn note_reference_serde_round_trip() {
        let r = NoteReference::new(Uuid::new_v4(), Uuid::new_v4(), ReferenceType::LinksTo);
        let json = serde_json::to_string(&r).unwrap();
        let deserialized: NoteReference = serde_json::from_str(&json).unwrap();
        assert_eq!(r, deserialized);
    }

    #[test]
    fn topic_relation_serde_round_trip() {
        let r = TopicRelation::new(
            Uuid::new_v4(),
            Uuid::new_v4(),
            TopicRelationType::SubtopicOf,
        );
        let json = serde_json::to_string(&r).unwrap();
        let deserialized: TopicRelation = serde_json::from_str(&json).unwrap();
        assert_eq!(r, deserialized);
    }

    #[test]
    fn source_type_serializes_snake_case() {
        assert_eq!(
            serde_json::to_string(&SourceType::Typed).unwrap(),
            r#""typed""#
        );
        assert_eq!(
            serde_json::to_string(&SourceType::Pasted).unwrap(),
            r#""pasted""#
        );
        assert_eq!(
            serde_json::to_string(&SourceType::Uploaded).unwrap(),
            r#""uploaded""#
        );
        assert_eq!(
            serde_json::to_string(&SourceType::Captured).unwrap(),
            r#""captured""#
        );
    }

    #[test]
    fn reference_type_serializes_kebab_case() {
        assert_eq!(
            serde_json::to_string(&ReferenceType::LinksTo).unwrap(),
            r#""links-to""#
        );
        assert_eq!(
            serde_json::to_string(&ReferenceType::Embeds).unwrap(),
            r#""embeds""#
        );
    }

    #[test]
    fn topic_relation_type_serializes_kebab_case() {
        assert_eq!(
            serde_json::to_string(&TopicRelationType::SubtopicOf).unwrap(),
            r#""subtopic-of""#
        );
        assert_eq!(
            serde_json::to_string(&TopicRelationType::RelatedTo).unwrap(),
            r#""related-to""#
        );
        assert_eq!(
            serde_json::to_string(&TopicRelationType::Classifies).unwrap(),
            r#""classifies""#
        );
    }
}

#[cfg(test)]
mod storage_init {
    use storage::init_storage;
    use tempfile::tempdir;

    #[test]
    fn creates_directory_structure() {
        let dir = tempdir().unwrap();
        let handle = init_storage(dir.path()).unwrap();

        assert!(handle.notes_dir().exists());
        assert!(handle.topics_dir().exists());
        assert!(handle.index_dir().exists());
        assert!(handle.config_path().exists());
        assert!(handle.index_dir().join("classifications.json").exists());
        assert!(handle.index_dir().join("references.json").exists());
        assert!(handle.index_dir().join("relations.json").exists());
        assert!(handle.topics_dir().join("topics.json").exists());
    }

    #[test]
    fn config_has_correct_version() {
        let dir = tempdir().unwrap();
        let handle = init_storage(dir.path()).unwrap();
        let config = storage::config::read_config(&handle).unwrap();
        assert_eq!(config.format_version, "1.0.0");
    }

    #[test]
    fn init_is_idempotent() {
        let dir = tempdir().unwrap();
        init_storage(dir.path()).unwrap();
        let handle = init_storage(dir.path()).unwrap();
        let config = storage::config::read_config(&handle).unwrap();
        assert_eq!(config.format_version, "1.0.0");
    }
}

#[cfg(test)]
mod storage_notes {
    use shared::model::{Note, SourceType};
    use storage::init_storage;
    use storage::notes;
    use tempfile::tempdir;

    #[test]
    fn crud_cycle() {
        let dir = tempdir().unwrap();
        let handle = init_storage(dir.path()).unwrap();

        // Create
        let note = Note::new(
            "My Note".into(),
            "# Hello\nContent here".into(),
            SourceType::Typed,
        );
        let note_id = note.id;
        notes::create_note(&handle, &note).unwrap();

        // Read
        let read = notes::read_note(&handle, &note_id).unwrap();
        assert_eq!(read.id, note_id);
        assert_eq!(read.title, "My Note");
        assert_eq!(read.content_raw, "# Hello\nContent here");

        // Update
        let mut updated = read;
        updated.title = "Updated Note".into();
        updated.content_raw = "# Updated\nNew content".into();
        updated.version = 2;
        notes::update_note(&handle, &updated).unwrap();

        let read2 = notes::read_note(&handle, &note_id).unwrap();
        assert_eq!(read2.title, "Updated Note");
        assert_eq!(read2.content_raw, "# Updated\nNew content");
        assert_eq!(read2.version, 2);

        // List
        let list = notes::list_notes(&handle).unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].title, "Updated Note");

        // Delete
        notes::delete_note(&handle, &note_id).unwrap();
        let list2 = notes::list_notes(&handle).unwrap();
        assert!(list2.is_empty());
    }

    #[test]
    fn create_duplicate_fails() {
        let dir = tempdir().unwrap();
        let handle = init_storage(dir.path()).unwrap();
        let note = Note::new("Note".into(), "content".into(), SourceType::Typed);
        notes::create_note(&handle, &note).unwrap();

        let err = notes::create_note(&handle, &note).unwrap_err();
        assert!(err.to_string().contains("already exists"));
    }

    #[test]
    fn read_nonexistent_fails() {
        let dir = tempdir().unwrap();
        let handle = init_storage(dir.path()).unwrap();
        let err = notes::read_note(&handle, &uuid::Uuid::new_v4()).unwrap_err();
        assert!(err.to_string().contains("not found"));
    }

    #[test]
    fn delete_nonexistent_fails() {
        let dir = tempdir().unwrap();
        let handle = init_storage(dir.path()).unwrap();
        let err = notes::delete_note(&handle, &uuid::Uuid::new_v4()).unwrap_err();
        assert!(err.to_string().contains("not found"));
    }
}

#[cfg(test)]
mod storage_topics {
    use shared::model::Topic;
    use storage::init_storage;
    use storage::topics;
    use tempfile::tempdir;

    #[test]
    fn crud_cycle() {
        let dir = tempdir().unwrap();
        let handle = init_storage(dir.path()).unwrap();

        // Create
        let topic = Topic::new("Rust".into(), Some("Programming language".into()));
        let topic_id = topic.id;
        topics::create_topic(&handle, &topic).unwrap();

        // Read
        let read = topics::read_topic(&handle, &topic_id).unwrap();
        assert_eq!(read.name, "Rust");
        assert_eq!(read.description, Some("Programming language".into()));

        // Update
        let mut updated = read;
        updated.name = "Rust Lang".into();
        updated.version = 2;
        topics::update_topic(&handle, &updated).unwrap();

        let read2 = topics::read_topic(&handle, &topic_id).unwrap();
        assert_eq!(read2.name, "Rust Lang");
        assert_eq!(read2.version, 2);

        // List
        let list = topics::list_topics(&handle).unwrap();
        assert_eq!(list.len(), 1);

        // Delete
        topics::delete_topic(&handle, &topic_id).unwrap();
        let list2 = topics::list_topics(&handle).unwrap();
        assert!(list2.is_empty());
    }

    #[test]
    fn duplicate_name_fails() {
        let dir = tempdir().unwrap();
        let handle = init_storage(dir.path()).unwrap();
        let t1 = Topic::new("Rust".into(), None);
        topics::create_topic(&handle, &t1).unwrap();

        let t2 = Topic::new("Rust".into(), None);
        let err = topics::create_topic(&handle, &t2).unwrap_err();
        assert!(err.to_string().contains("already exists"));
    }
}

#[cfg(test)]
mod storage_classifications {
    use shared::model::{Note, SourceType, Topic};
    use storage::init_storage;
    use storage::{notes, relations, topics};
    use tempfile::tempdir;

    #[test]
    fn classify_and_query() {
        let dir = tempdir().unwrap();
        let handle = init_storage(dir.path()).unwrap();

        let note = Note::new("Note".into(), "content".into(), SourceType::Typed);
        let topic = Topic::new("Topic".into(), None);
        notes::create_note(&handle, &note).unwrap();
        topics::create_topic(&handle, &topic).unwrap();

        relations::classify_note(&handle, note.id, topic.id).unwrap();

        let note_topics = relations::get_note_topics(&handle, note.id).unwrap();
        assert_eq!(note_topics.len(), 1);
        assert_eq!(note_topics[0].id, topic.id);

        let topic_notes = relations::get_topic_notes(&handle, topic.id).unwrap();
        assert_eq!(topic_notes.len(), 1);
        assert_eq!(topic_notes[0].id, note.id);

        // Unclassify
        relations::unclassify_note(&handle, note.id, topic.id).unwrap();
        let note_topics2 = relations::get_note_topics(&handle, note.id).unwrap();
        assert!(note_topics2.is_empty());
    }

    #[test]
    fn duplicate_classification_fails() {
        let dir = tempdir().unwrap();
        let handle = init_storage(dir.path()).unwrap();

        let note = Note::new("Note".into(), "c".into(), SourceType::Typed);
        let topic = Topic::new("Topic".into(), None);
        notes::create_note(&handle, &note).unwrap();
        topics::create_topic(&handle, &topic).unwrap();

        relations::classify_note(&handle, note.id, topic.id).unwrap();
        let err = relations::classify_note(&handle, note.id, topic.id).unwrap_err();
        assert!(err.to_string().contains("already exists"));
    }
}

#[cfg(test)]
mod storage_references {
    use shared::model::{NoteReference, ReferenceType};
    use storage::init_storage;
    use storage::relations;
    use tempfile::tempdir;
    use uuid::Uuid;

    #[test]
    fn add_and_get_backlinks() {
        let dir = tempdir().unwrap();
        let handle = init_storage(dir.path()).unwrap();

        let src = Uuid::new_v4();
        let tgt = Uuid::new_v4();
        let reference = NoteReference::new(src, tgt, ReferenceType::LinksTo);
        relations::add_reference(&handle, &reference).unwrap();

        let backlinks = relations::get_backlinks(&handle, tgt).unwrap();
        assert_eq!(backlinks.len(), 1);
        assert_eq!(backlinks[0].source_note_id, src);

        // Remove
        relations::remove_reference(&handle, src, tgt).unwrap();
        let backlinks2 = relations::get_backlinks(&handle, tgt).unwrap();
        assert!(backlinks2.is_empty());
    }
}

#[cfg(test)]
mod storage_topic_relations {
    use shared::model::{TopicRelation, TopicRelationType};
    use storage::init_storage;
    use storage::relations;
    use tempfile::tempdir;
    use uuid::Uuid;

    #[test]
    fn add_and_get_relations() {
        let dir = tempdir().unwrap();
        let handle = init_storage(dir.path()).unwrap();

        let parent = Uuid::new_v4();
        let child = Uuid::new_v4();
        let rel = TopicRelation::new(child, parent, TopicRelationType::SubtopicOf);
        relations::add_topic_relation(&handle, &rel).unwrap();

        let rels = relations::get_topic_relations(&handle, child).unwrap();
        assert_eq!(rels.len(), 1);
        assert_eq!(rels[0].relation_type, TopicRelationType::SubtopicOf);

        // Also found from parent side
        let rels2 = relations::get_topic_relations(&handle, parent).unwrap();
        assert_eq!(rels2.len(), 1);

        // Remove
        relations::remove_topic_relation(&handle, child, parent).unwrap();
        let rels3 = relations::get_topic_relations(&handle, child).unwrap();
        assert!(rels3.is_empty());
    }
}

#[cfg(test)]
mod storage_assets {
    use shared::model::{Note, SourceType};
    use storage::init_storage;
    use storage::{assets, notes};
    use tempfile::tempdir;

    #[test]
    fn save_read_delete_asset() {
        let dir = tempdir().unwrap();
        let handle = init_storage(dir.path()).unwrap();

        let note = Note::new("Note".into(), "content".into(), SourceType::Typed);
        notes::create_note(&handle, &note).unwrap();

        let data = b"fake png data";
        let asset = assets::save_asset(
            &handle,
            note.id,
            "image.png",
            "image/png",
            SourceType::Uploaded,
            data,
        )
        .unwrap();
        assert_eq!(asset.filename, "image.png");
        assert_eq!(asset.size_bytes, data.len() as u64);

        // Read back
        let read_data = assets::read_asset(&handle, note.id, asset.id).unwrap();
        assert_eq!(read_data, data);

        // List
        let list = assets::list_assets(&handle, note.id).unwrap();
        assert_eq!(list.len(), 1);

        // Delete
        assets::delete_asset(&handle, note.id, asset.id).unwrap();
        let list2 = assets::list_assets(&handle, note.id).unwrap();
        assert!(list2.is_empty());
    }
}
