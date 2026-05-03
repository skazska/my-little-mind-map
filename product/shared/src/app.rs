use shared_types::ids::{NoteId, SpaceId};
use shared_types::model::{Label, Note, NoteMetadata, Space};

use crate::effect::{Effect, StorageRequest};
use crate::event::{Event, OverviewTabRequest};
use crate::model::{Model, OverviewTab, Screen};
use crate::viewmodel::{
    LabelSummary, NoteEditorViewModel, NoteListViewModel, OverviewViewModel, SpaceSummary,
    ViewModel,
};

// ── Core entry points ─────────────────────────────────────────────────────────

/// Pure update function: `(Event, &mut Model) → Vec<Effect>`.
///
/// No I/O is performed here. Effects are returned for the shell to execute,
/// whose results come back as response events. [S-ARCH-1]
pub fn update(event: Event, model: &mut Model) -> Vec<Effect> {
    match event {
        // ── Lifecycle ─────────────────────────────────────────────────────────
        Event::AppStarted { data_folder } => {
            if data_folder.is_some() {
                model.data_folder = data_folder;
                model.loading = true;
                vec![
                    Effect::Storage(StorageRequest::LoadSettings),
                    Effect::Storage(StorageRequest::LoadSpaces),
                ]
            } else {
                model.screen = Screen::FirstLaunch;
                vec![Effect::Render]
            }
        }

        Event::DataFolderSelected { path } => {
            model.data_folder = Some(path.clone());
            model.loading = true;
            vec![
                Effect::Storage(StorageRequest::SaveSettings {
                    settings: shared_types::model::Settings {
                        data_folder: Some(path),
                        ..Default::default()
                    },
                }),
                Effect::Storage(StorageRequest::LoadSpaces),
            ]
        }

        // ── Navigation ────────────────────────────────────────────────────────
        Event::NavigateOverview { tab } => {
            model.screen = Screen::Overview(tab_request_to_tab(tab));
            vec![Effect::Render]
        }

        Event::NavigateToSpace { id } => {
            model.screen = Screen::NoteList;
            model.loading = true;
            vec![Effect::Storage(StorageRequest::LoadNotes { space_id: id })]
        }

        Event::NavigateToNote { id } => {
            model.loading = true;
            vec![Effect::Storage(StorageRequest::LoadNote { id })]
        }

        Event::NavigateBack => {
            model.current_note = None;
            match &model.current_space {
                Some(space) => {
                    let id = space.id.clone();
                    model.screen = Screen::NoteList;
                    vec![Effect::Storage(StorageRequest::LoadNotes { space_id: id })]
                }
                None => {
                    model.screen = Screen::Overview(OverviewTab::Spaces);
                    vec![Effect::Render]
                }
            }
        }

        // ── Spaces ────────────────────────────────────────────────────────────
        Event::CreateSpace { name, description } => match SpaceId::new(slug(&name)) {
            Err(e) => {
                model.error = Some(e.to_string());
                vec![Effect::Render]
            }
            Ok(id) => {
                let space = Space {
                    id,
                    name,
                    description,
                    labels: vec![],
                    parent_id: None,
                };
                vec![Effect::Storage(StorageRequest::CreateSpace { space })]
            }
        },

        Event::DeleteSpace { id } => {
            vec![Effect::Storage(StorageRequest::DeleteSpace { id })]
        }

        // ── Notes ─────────────────────────────────────────────────────────────
        Event::CreateNote {
            title,
            space_id,
            parent_id,
        } => match NoteId::new(format!("{}/{}", space_id.as_str(), slug(&title))) {
            Err(e) => {
                model.error = Some(e.to_string());
                vec![Effect::Render]
            }
            Ok(id) => {
                let mut meta = NoteMetadata::new(title, Some(space_id));
                meta.draft = true;
                let note = Note {
                    id,
                    metadata: meta,
                    content: String::new(),
                    parent_id,
                };
                vec![Effect::Storage(StorageRequest::SaveNote { note })]
            }
        },

        Event::UpdateNote {
            id,
            content,
            labels,
        } => {
            if let Some(note) = model.current_note.as_mut() {
                if note.id == id {
                    note.content = apply_label_commands(&content, &mut note.metadata.labels);
                    note.metadata.labels = labels_from_strings(&labels);
                    note.metadata.touch();
                    let updated = note.clone();
                    return vec![Effect::Storage(StorageRequest::SaveNote { note: updated })];
                }
            }
            model.error = Some(format!("UpdateNote: note {id} not loaded"));
            vec![Effect::Render]
        }

        Event::PublishNote { id } => {
            if let Some(note) = model.current_note.as_mut() {
                if note.id == id {
                    note.metadata.draft = false;
                    note.metadata.touch();
                    let updated = note.clone();
                    return vec![Effect::Storage(StorageRequest::SaveNote { note: updated })];
                }
            }
            vec![]
        }

        Event::DeleteNote { id } => {
            vec![Effect::Storage(StorageRequest::DeleteNote { id })]
        }

        // ── Filtering ─────────────────────────────────────────────────────────
        Event::SetActiveView { labels } => {
            model.active_view_labels = labels;
            vec![Effect::Render]
        }

        Event::ClearView => {
            model.active_view_labels.clear();
            vec![Effect::Render]
        }

        Event::SearchChanged { query } => {
            model.search_query = query;
            vec![Effect::Render]
        }

        // ── Effect responses ──────────────────────────────────────────────────
        Event::SettingsLoaded { settings } => {
            if let Some(folder) = settings.data_folder {
                model.data_folder = Some(folder);
            }
            vec![]
        }

        Event::SpacesLoaded { spaces } => {
            model.spaces = spaces;
            model.loading = false;
            model.screen = Screen::Overview(OverviewTab::Spaces);
            vec![Effect::Render]
        }

        Event::NoteListLoaded {
            space_id,
            note_ids: _,
        } => {
            // Keep only the notes we already have for this space; shell will
            // follow up with LoadNote for each id as needed.
            model.current_space = model.spaces.iter().find(|s| s.id == space_id).cloned();
            model
                .notes
                .retain(|n| n.id.space_segment() == space_id.as_str());
            model.loading = false;
            vec![Effect::Render]
        }

        Event::NoteLoaded { note } => {
            model.current_note = Some(note.clone());
            model.screen = Screen::NoteEditor;
            model.loading = false;
            // Upsert in notes list.
            if let Some(existing) = model.notes.iter_mut().find(|n| n.id == note.id) {
                *existing = note;
            } else {
                model.notes.push(note);
            }
            vec![Effect::Render]
        }

        Event::NoteSaved { id } => {
            model.loading = false;
            model.error = None;
            // Reload the note to get fresh data.
            vec![Effect::Storage(StorageRequest::LoadNote { id })]
        }

        Event::NoteDeleted { id } => {
            model.notes.retain(|n| n.id != id);
            if model.current_note.as_ref().map(|n| &n.id) == Some(&id) {
                model.current_note = None;
                model.screen = Screen::NoteList;
            }
            vec![Effect::Render]
        }

        Event::SpaceCreated { space } => {
            if !model.spaces.iter().any(|s| s.id == space.id) {
                model.spaces.push(space);
            }
            model.screen = Screen::Overview(OverviewTab::Spaces);
            vec![Effect::Render]
        }

        Event::SpaceDeleted { id } => {
            model.spaces.retain(|s| s.id != id);
            if model.current_space.as_ref().map(|s| &s.id) == Some(&id) {
                model.current_space = None;
                model.screen = Screen::Overview(OverviewTab::Spaces);
            }
            vec![Effect::Render]
        }

        Event::EffectError { message } => {
            model.error = Some(message);
            model.loading = false;
            vec![Effect::Render]
        }
    }
}

/// Build the `ViewModel` from the current `Model` (pure, no I/O). [S-ARCH-1]
pub fn view(model: &Model) -> ViewModel {
    if model.loading {
        return ViewModel::Loading;
    }
    if let Some(msg) = &model.error {
        return ViewModel::Error {
            message: msg.clone(),
        };
    }
    match &model.screen {
        Screen::Loading => ViewModel::Loading,

        Screen::FirstLaunch => ViewModel::FirstLaunch,

        Screen::Overview(tab) => ViewModel::Overview(OverviewViewModel {
            active_tab: tab.clone(),
            spaces: model.spaces.iter().map(SpaceSummary::from).collect(),
            labels: derive_label_summaries(&model.notes),
            search_query: model.search_query.clone(),
            data_folder: model.data_folder.clone(),
            error: model.error.clone(),
        }),

        Screen::NoteList => {
            let space = model.current_space.as_ref();
            let space_id = space.map(|s| s.id.to_string()).unwrap_or_default();
            let space_name = space.map(|s| s.name.clone()).unwrap_or_default();

            let mut notes: Vec<_> = model
                .notes
                .iter()
                .filter(|n| n.id.space_segment() == space_id)
                .collect();

            // Apply label filter. [S-DM-V1]
            if !model.active_view_labels.is_empty() {
                notes.retain(|n| {
                    let note_labels: Vec<&str> =
                        n.metadata.labels.iter().map(|l| l.0.as_str()).collect();
                    model
                        .active_view_labels
                        .iter()
                        .all(|vl| note_labels.contains(&vl.as_str()))
                });
            }

            // Apply search filter.
            if !model.search_query.is_empty() {
                let q = model.search_query.to_lowercase();
                notes.retain(|n| {
                    n.metadata.title.to_lowercase().contains(&q)
                        || n.content.to_lowercase().contains(&q)
                });
            }

            ViewModel::NoteList(NoteListViewModel {
                space_id,
                space_name,
                notes: notes
                    .iter()
                    .map(|n| crate::viewmodel::NoteListItem::from(*n))
                    .collect(),
                search_query: model.search_query.clone(),
                active_view_labels: model.active_view_labels.clone(),
                error: model.error.clone(),
            })
        }

        Screen::NoteEditor => match &model.current_note {
            None => ViewModel::Error {
                message: "no note loaded".into(),
            },
            Some(note) => ViewModel::NoteEditor(NoteEditorViewModel::from(note)),
        },
    }
}

// ── Private helpers ───────────────────────────────────────────────────────────

fn slug(s: &str) -> String {
    s.chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() {
                c.to_ascii_lowercase()
            } else {
                '-'
            }
        })
        .collect::<String>()
        // collapse consecutive hyphens
        .split('-')
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("-")
}

fn tab_request_to_tab(req: OverviewTabRequest) -> OverviewTab {
    match req {
        OverviewTabRequest::Spaces => OverviewTab::Spaces,
        OverviewTabRequest::Labels => OverviewTab::Labels,
        OverviewTabRequest::Views => OverviewTab::Views,
        OverviewTabRequest::Recent => OverviewTab::Recent,
        OverviewTabRequest::Search => OverviewTab::Search,
    }
}

fn labels_from_strings(labels: &[String]) -> Vec<Label> {
    labels
        .iter()
        .filter(|s| !s.is_empty())
        .map(|s| Label(s.clone()))
        .collect()
}

/// Process inline `/:labels tag1 tag2;` commands in content. [S-UX-NE2]
fn apply_label_commands(content: &str, labels: &mut Vec<Label>) -> String {
    let mut result = String::with_capacity(content.len());
    for line in content.lines() {
        let trimmed = line.trim();
        if let Some(rest) = trimmed.strip_prefix("/:labels ") {
            if let Some(args) = rest.strip_suffix(';') {
                // Replace existing labels with the command's list.
                *labels = args
                    .split_whitespace()
                    .filter(|s| !s.is_empty())
                    .map(|s| Label(s.to_string()))
                    .collect();
                // Don't include the command line in the stored content.
                continue;
            }
        }
        result.push_str(line);
        result.push('\n');
    }
    result.trim_end().to_string()
}

fn derive_label_summaries(notes: &[Note]) -> Vec<LabelSummary> {
    use std::collections::HashMap;
    let mut counts: HashMap<&str, usize> = HashMap::new();
    for note in notes {
        for label in &note.metadata.labels {
            *counts.entry(label.0.as_str()).or_insert(0) += 1;
        }
    }
    let mut summaries: Vec<LabelSummary> = counts
        .into_iter()
        .map(|(label, note_count)| LabelSummary {
            label: label.to_string(),
            note_count,
        })
        .collect();
    summaries.sort_by(|a, b| a.label.cmp(&b.label));
    summaries
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn fresh_model() -> Model {
        Model::default()
    }

    #[test]
    fn app_started_without_folder_shows_first_launch() {
        let mut model = fresh_model();
        let effects = update(Event::AppStarted { data_folder: None }, &mut model);
        assert_eq!(model.screen, Screen::FirstLaunch);
        assert!(effects.iter().any(|e| matches!(e, Effect::Render)));
    }

    #[test]
    fn app_started_with_folder_requests_storage() {
        let mut model = fresh_model();
        let effects = update(
            Event::AppStarted {
                data_folder: Some("/data".into()),
            },
            &mut model,
        );
        assert!(effects
            .iter()
            .any(|e| matches!(e, Effect::Storage(StorageRequest::LoadSpaces))));
    }

    #[test]
    fn spaces_loaded_updates_model_and_renders() {
        let mut model = fresh_model();
        let spaces = vec![Space {
            id: SpaceId::new("my-space").unwrap(),
            name: "My Space".into(),
            description: None,
            labels: vec![],
            parent_id: None,
        }];
        let effects = update(
            Event::SpacesLoaded {
                spaces: spaces.clone(),
            },
            &mut model,
        );
        assert_eq!(model.spaces.len(), 1);
        assert!(!model.loading);
        assert!(matches!(
            model.screen,
            Screen::Overview(OverviewTab::Spaces)
        ));
        assert!(effects.iter().any(|e| matches!(e, Effect::Render)));
    }

    #[test]
    fn create_space_produces_storage_effect() {
        let mut model = fresh_model();
        let effects = update(
            Event::CreateSpace {
                name: "My New Space".into(),
                description: None,
            },
            &mut model,
        );
        assert!(effects
            .iter()
            .any(|e| matches!(e, Effect::Storage(StorageRequest::CreateSpace { .. }))));
    }

    #[test]
    fn create_note_produces_save_effect() {
        let mut model = fresh_model();
        let space_id = SpaceId::new("space1").unwrap();
        let effects = update(
            Event::CreateNote {
                title: "My Note".into(),
                space_id,
                parent_id: None,
            },
            &mut model,
        );
        assert!(effects
            .iter()
            .any(|e| matches!(e, Effect::Storage(StorageRequest::SaveNote { .. }))));
    }

    #[test]
    fn navigate_back_without_space_goes_to_overview() {
        let mut model = fresh_model();
        model.screen = Screen::NoteEditor;
        let effects = update(Event::NavigateBack, &mut model);
        assert!(matches!(
            model.screen,
            Screen::Overview(OverviewTab::Spaces)
        ));
        assert!(effects.iter().any(|e| matches!(e, Effect::Render)));
    }

    #[test]
    fn label_command_applied_and_stripped_from_content() {
        let content = "# My Note\n\n/:labels rust learning;\n\nReal content.";
        let mut labels = vec![];
        let result = apply_label_commands(content, &mut labels);
        assert!(!result.contains("/:labels"));
        assert_eq!(labels.len(), 2);
        assert_eq!(labels[0].0, "rust");
        assert_eq!(labels[1].0, "learning");
    }

    #[test]
    fn search_filter_applied_in_view() {
        let mut model = fresh_model();
        model.screen = Screen::NoteList;
        model.search_query = "rust".into();
        model.current_space = Some(Space {
            id: SpaceId::new("space1").unwrap(),
            name: "Space1".into(),
            description: None,
            labels: vec![],
            parent_id: None,
        });

        let mut meta1 = NoteMetadata::new("rust-note", Some(SpaceId::new("space1").unwrap()));
        meta1.draft = false;
        let note1 = Note {
            id: NoteId::new("space1/rust-note").unwrap(),
            metadata: meta1,
            content: "Rust content".into(),
            parent_id: None,
        };

        let mut meta2 = NoteMetadata::new("other-note", Some(SpaceId::new("space1").unwrap()));
        meta2.draft = false;
        let note2 = Note {
            id: NoteId::new("space1/other-note").unwrap(),
            metadata: meta2,
            content: "Other content".into(),
            parent_id: None,
        };

        model.notes = vec![note1, note2];

        let vm = view(&model);
        if let ViewModel::NoteList(list_vm) = vm {
            assert_eq!(list_vm.notes.len(), 1);
            assert_eq!(list_vm.notes[0].title, "rust-note");
        } else {
            panic!("expected NoteList viewmodel");
        }
    }

    #[test]
    fn slug_normalises_titles() {
        assert_eq!(slug("My New Space"), "my-new-space");
        assert_eq!(slug("  leading space"), "leading-space");
        assert_eq!(slug("double--hyphens"), "double-hyphens");
    }
}
