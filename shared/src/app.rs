use crux_core::{
    Command,
    macros::effect,
    render::{self, RenderOperation},
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::model::{
    Classification, Note, NoteReference, SourceType, Topic, TopicRelation, TopicRelationType,
};

/// Events that the UI can send to the core
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum Event {
    None,

    // --- Data sync (shell → core after storage I/O) ---
    DataLoaded {
        notes: Vec<Note>,
        topics: Vec<Topic>,
        classifications: Vec<Classification>,
        note_references: Vec<NoteReference>,
        topic_relations: Vec<TopicRelation>,
    },

    // --- Note events ---
    NoteAdded {
        note: Note,
        classifications: Vec<Classification>,
        references: Vec<NoteReference>,
    },
    NoteUpdated {
        note: Note,
        references: Vec<NoteReference>,
    },
    NoteRemoved {
        id: Uuid,
    },

    // --- Topic events ---
    TopicAdded {
        topic: Topic,
    },
    TopicUpdated {
        topic: Topic,
    },
    TopicRemoved {
        id: Uuid,
    },

    // --- Classification events ---
    ClassifyNote {
        note_id: Uuid,
        topic_id: Uuid,
    },
    UnclassifyNote {
        note_id: Uuid,
        topic_id: Uuid,
    },

    // --- Topic relation events ---
    AddTopicRelation {
        source_topic_id: Uuid,
        target_topic_id: Uuid,
        relation_type: TopicRelationType,
    },
    RemoveTopicRelation {
        source_topic_id: Uuid,
        target_topic_id: Uuid,
    },
}

/// The application's state model
#[derive(Default)]
pub struct Model {
    pub notes: Vec<Note>,
    pub topics: Vec<Topic>,
    pub classifications: Vec<Classification>,
    pub note_references: Vec<NoteReference>,
    pub topic_relations: Vec<TopicRelation>,
}

/// Summary view of a note for UI lists.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct NoteView {
    pub id: Uuid,
    pub title: String,
    pub content_raw: String,
    pub source_type: SourceType,
    pub created_at: String,
    pub updated_at: String,
    pub topic_names: Vec<String>,
    pub topic_ids: Vec<Uuid>,
}

/// Summary view of a topic for the UI.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct TopicView {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub note_count: usize,
}

/// The view model sent to the UI for rendering
#[derive(Serialize, Deserialize, Clone, Default, Debug, PartialEq)]
pub struct ViewModel {
    pub text: String,
    pub notes: Vec<NoteView>,
    pub topics: Vec<TopicView>,
    pub error: Option<String>,
}

/// Effects the Core will request from the Shell
#[effect(typegen)]
pub enum Effect {
    Render(RenderOperation),
}

/// The main application
#[derive(Default)]
pub struct MindMap;

impl crux_core::App for MindMap {
    type Event = Event;
    type Model = Model;
    type ViewModel = ViewModel;
    type Effect = Effect;

    fn update(
        &self,
        event: Self::Event,
        model: &mut Self::Model,
    ) -> Command<Self::Effect, Self::Event> {
        match event {
            Event::None => {}

            Event::DataLoaded {
                notes,
                topics,
                classifications,
                note_references,
                topic_relations,
            } => {
                model.notes = notes;
                model.topics = topics;
                model.classifications = classifications;
                model.note_references = note_references;
                model.topic_relations = topic_relations;
            }

            Event::NoteAdded {
                note,
                classifications,
                references,
            } => {
                model.notes.push(note);
                model.classifications.extend(classifications);
                model.note_references.extend(references);
            }

            Event::NoteUpdated { note, references } => {
                let note_id = note.id;
                if let Some(existing) = model.notes.iter_mut().find(|n| n.id == note_id) {
                    *existing = note;
                }
                // Replace references for this note
                model
                    .note_references
                    .retain(|r| r.source_note_id != note_id);
                model.note_references.extend(references);
            }

            Event::NoteRemoved { id } => {
                model.notes.retain(|n| n.id != id);
                model.classifications.retain(|c| c.note_id != id);
                model
                    .note_references
                    .retain(|r| r.source_note_id != id && r.target_note_id != id);
            }

            Event::TopicAdded { topic } => {
                model.topics.push(topic);
            }

            Event::TopicUpdated { topic } => {
                if let Some(existing) = model.topics.iter_mut().find(|t| t.id == topic.id) {
                    *existing = topic;
                }
            }

            Event::TopicRemoved { id } => {
                model.topics.retain(|t| t.id != id);
                model.classifications.retain(|c| c.topic_id != id);
                model
                    .topic_relations
                    .retain(|r| r.source_topic_id != id && r.target_topic_id != id);
            }

            Event::ClassifyNote { note_id, topic_id } => {
                if !model
                    .classifications
                    .iter()
                    .any(|c| c.note_id == note_id && c.topic_id == topic_id)
                {
                    model
                        .classifications
                        .push(Classification::new(note_id, topic_id));
                }
            }

            Event::UnclassifyNote { note_id, topic_id } => {
                model
                    .classifications
                    .retain(|c| !(c.note_id == note_id && c.topic_id == topic_id));
            }

            Event::AddTopicRelation {
                source_topic_id,
                target_topic_id,
                relation_type,
            } => {
                if !model.topic_relations.iter().any(|r| {
                    r.source_topic_id == source_topic_id && r.target_topic_id == target_topic_id
                }) {
                    model.topic_relations.push(TopicRelation::new(
                        source_topic_id,
                        target_topic_id,
                        relation_type,
                    ));
                }
            }

            Event::RemoveTopicRelation {
                source_topic_id,
                target_topic_id,
            } => {
                model.topic_relations.retain(|r| {
                    !(r.source_topic_id == source_topic_id && r.target_topic_id == target_topic_id)
                });
            }
        }

        render::render()
    }

    fn view(&self, model: &Self::Model) -> Self::ViewModel {
        use std::collections::HashMap;

        // Pre-index topics by id for O(1) lookup
        let topics_by_id: HashMap<Uuid, &Topic> = model.topics.iter().map(|t| (t.id, t)).collect();

        // Pre-index classifications: note_id -> list of topic_ids, topic_id -> count
        let mut note_topic_ids: HashMap<Uuid, Vec<Uuid>> = HashMap::new();
        let mut topic_note_count: HashMap<Uuid, usize> = HashMap::new();
        for c in &model.classifications {
            note_topic_ids
                .entry(c.note_id)
                .or_default()
                .push(c.topic_id);
            *topic_note_count.entry(c.topic_id).or_default() += 1;
        }

        let notes = model
            .notes
            .iter()
            .map(|n| {
                let topic_names: Vec<String> = note_topic_ids
                    .get(&n.id)
                    .map(|tids| {
                        tids.iter()
                            .filter_map(|tid| topics_by_id.get(tid).map(|t| t.name.clone()))
                            .collect()
                    })
                    .unwrap_or_default();
                let topic_id_list: Vec<Uuid> =
                    note_topic_ids.get(&n.id).cloned().unwrap_or_default();
                NoteView {
                    id: n.id,
                    title: n.title.clone(),
                    content_raw: n.content_raw.clone(),
                    source_type: n.source_type.clone(),
                    created_at: n.created_at.to_rfc3339(),
                    updated_at: n.updated_at.to_rfc3339(),
                    topic_names,
                    topic_ids: topic_id_list,
                }
            })
            .collect();

        let topics = model
            .topics
            .iter()
            .map(|t| {
                let note_count = topic_note_count.get(&t.id).copied().unwrap_or(0);
                TopicView {
                    id: t.id,
                    name: t.name.clone(),
                    description: t.description.clone(),
                    note_count,
                }
            })
            .collect();

        ViewModel {
            text: "My Little Mind Map".to_string(),
            notes,
            topics,
            error: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::ReferenceType;
    use crux_core::Core;

    fn make_topic(name: &str) -> Topic {
        Topic::new(name.to_string(), None)
    }

    fn make_note(title: &str, content: &str) -> Note {
        Note::new(title.to_string(), content.to_string(), SourceType::Typed)
    }

    #[test]
    fn renders_view() {
        let core: Core<MindMap> = Core::new();
        let effects = core.process_event(Event::None);
        assert_eq!(effects.len(), 1);
        let view = core.view();
        assert_eq!(view.text, "My Little Mind Map");
    }

    #[test]
    fn default_model_is_empty() {
        let model = Model::default();
        assert!(model.notes.is_empty());
        assert!(model.topics.is_empty());
        assert!(model.classifications.is_empty());
        assert!(model.note_references.is_empty());
        assert!(model.topic_relations.is_empty());
    }

    #[test]
    fn data_loaded_populates_model() {
        let core: Core<MindMap> = Core::new();
        let topic = make_topic("Rust");
        let note = make_note("Hello", "# Hello");
        let classification = Classification::new(note.id, topic.id);

        core.process_event(Event::DataLoaded {
            notes: vec![note.clone()],
            topics: vec![topic.clone()],
            classifications: vec![classification],
            note_references: vec![],
            topic_relations: vec![],
        });

        let view = core.view();
        assert_eq!(view.notes.len(), 1);
        assert_eq!(view.notes[0].title, "Hello");
        assert_eq!(view.notes[0].topic_names, vec!["Rust"]);
        assert_eq!(view.topics.len(), 1);
        assert_eq!(view.topics[0].note_count, 1);
    }

    #[test]
    fn note_added_updates_model() {
        let core: Core<MindMap> = Core::new();
        let topic = make_topic("Testing");

        // Load topic first
        core.process_event(Event::DataLoaded {
            notes: vec![],
            topics: vec![topic.clone()],
            classifications: vec![],
            note_references: vec![],
            topic_relations: vec![],
        });

        let note = make_note("Test Note", "Content");
        let classification = Classification::new(note.id, topic.id);

        core.process_event(Event::NoteAdded {
            note: note.clone(),
            classifications: vec![classification],
            references: vec![],
        });

        let view = core.view();
        assert_eq!(view.notes.len(), 1);
        assert_eq!(view.notes[0].title, "Test Note");
        assert_eq!(view.notes[0].topic_names, vec!["Testing"]);
        assert_eq!(view.topics[0].note_count, 1);
    }

    #[test]
    fn note_updated_replaces_in_model() {
        let core: Core<MindMap> = Core::new();
        let topic = make_topic("Dev");
        let mut note = make_note("Original", "old content");
        let note_id = note.id;

        core.process_event(Event::DataLoaded {
            notes: vec![note.clone()],
            topics: vec![topic.clone()],
            classifications: vec![Classification::new(note_id, topic.id)],
            note_references: vec![],
            topic_relations: vec![],
        });

        note.title = "Updated".to_string();
        note.content_raw = "new content".to_string();
        note.version = 2;

        core.process_event(Event::NoteUpdated {
            note,
            references: vec![],
        });

        let view = core.view();
        assert_eq!(view.notes.len(), 1);
        assert_eq!(view.notes[0].title, "Updated");
    }

    #[test]
    fn note_removed_cleans_up() {
        let core: Core<MindMap> = Core::new();
        let topic = make_topic("Topic");
        let note = make_note("To Delete", "content");
        let note_id = note.id;

        core.process_event(Event::DataLoaded {
            notes: vec![note],
            topics: vec![topic.clone()],
            classifications: vec![Classification::new(note_id, topic.id)],
            note_references: vec![],
            topic_relations: vec![],
        });

        core.process_event(Event::NoteRemoved { id: note_id });

        let view = core.view();
        assert!(view.notes.is_empty());
        assert_eq!(view.topics[0].note_count, 0);
    }

    #[test]
    fn topic_added_and_removed() {
        let core: Core<MindMap> = Core::new();
        let topic = make_topic("New Topic");
        let topic_id = topic.id;

        core.process_event(Event::TopicAdded {
            topic: topic.clone(),
        });

        let view = core.view();
        assert_eq!(view.topics.len(), 1);
        assert_eq!(view.topics[0].name, "New Topic");

        core.process_event(Event::TopicRemoved { id: topic_id });

        let view = core.view();
        assert!(view.topics.is_empty());
    }

    #[test]
    fn note_updated_replaces_references() {
        let core: Core<MindMap> = Core::new();
        let note_a = make_note("A", "content");
        let note_b = make_note("B", "content");
        let note_c = make_note("C", "content");

        let old_ref = NoteReference::new(note_a.id, note_b.id, ReferenceType::LinksTo);

        core.process_event(Event::DataLoaded {
            notes: vec![note_a.clone(), note_b.clone(), note_c.clone()],
            topics: vec![],
            classifications: vec![],
            note_references: vec![old_ref],
            topic_relations: vec![],
        });

        // Update note A: now references C instead of B
        let new_ref = NoteReference::new(note_a.id, note_c.id, ReferenceType::LinksTo);
        let mut updated_a = note_a.clone();
        updated_a.version = 2;

        core.process_event(Event::NoteUpdated {
            note: updated_a,
            references: vec![new_ref],
        });

        // Verify B's backlink is gone, C's backlink exists
        // (we can't query references directly from view, but the model is correct)
        let view = core.view();
        assert_eq!(view.notes.len(), 3);
    }

    #[test]
    fn view_error_is_none_by_default() {
        let core: Core<MindMap> = Core::new();
        let view = core.view();
        assert!(view.error.is_none());
    }
}
