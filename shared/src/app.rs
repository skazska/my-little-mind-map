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
    // --- Note events (handlers in Phase 2) ---
    CreateNote {
        title: String,
        content: String,
        topic_ids: Vec<Uuid>,
    },
    UpdateNote {
        id: Uuid,
        title: String,
        content: String,
    },
    DeleteNote {
        id: Uuid,
    },
    // --- Topic events ---
    CreateTopic {
        name: String,
        description: Option<String>,
    },
    UpdateTopic {
        id: Uuid,
        name: String,
        description: Option<String>,
    },
    DeleteTopic {
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
    // --- Reference events ---
    AddNoteReference {
        source_note_id: Uuid,
        target_note_id: Uuid,
    },
    RemoveNoteReference {
        source_note_id: Uuid,
        target_note_id: Uuid,
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
    pub source_type: SourceType,
    pub created_at: String,
    pub updated_at: String,
    pub topic_names: Vec<String>,
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
        _event: Self::Event,
        _model: &mut Self::Model,
    ) -> Command<Self::Effect, Self::Event> {
        // Phase 2 will implement event handlers.
        render::render()
    }

    fn view(&self, model: &Self::Model) -> Self::ViewModel {
        let notes = model
            .notes
            .iter()
            .map(|n| {
                let topic_names: Vec<String> = model
                    .classifications
                    .iter()
                    .filter(|c| c.note_id == n.id)
                    .filter_map(|c| model.topics.iter().find(|t| t.id == c.topic_id))
                    .map(|t| t.name.clone())
                    .collect();
                NoteView {
                    id: n.id,
                    title: n.title.clone(),
                    source_type: n.source_type.clone(),
                    created_at: n.created_at.to_rfc3339(),
                    updated_at: n.updated_at.to_rfc3339(),
                    topic_names,
                }
            })
            .collect();

        let topics = model
            .topics
            .iter()
            .map(|t| {
                let note_count = model
                    .classifications
                    .iter()
                    .filter(|c| c.topic_id == t.id)
                    .count();
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
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crux_core::Core;

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
}
