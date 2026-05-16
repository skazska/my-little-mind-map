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
            let current_screen = model.screen.clone();
            model.current_note = None;
            model.error = None; // [TC-AL-ERR-02] dismiss error on back navigation
            match current_screen {
                Screen::NoteEditor => {
                    // From editor: go back to note list for the current space.
                    match model.current_space.as_ref().map(|s| s.id.clone()) {
                        Some(id) => {
                            model.screen = Screen::NoteList;
                            vec![Effect::Storage(StorageRequest::LoadNotes { space_id: id })]
                        }
                        None => {
                            model.screen = Screen::Overview(OverviewTab::Spaces);
                            vec![Effect::Render]
                        }
                    }
                }
                _ => {
                    // From note list or any other screen: go to overview.
                    model.current_space = None;
                    model.notes.clear();
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
                    note_count: 0,
                };
                vec![Effect::Storage(StorageRequest::CreateSpace { space })]
            }
        },

        Event::DeleteSpace { id } => {
            vec![Effect::Storage(StorageRequest::DeleteSpace { id })]
        }

        // ── Notes ─────────────────────────────────────────────────────────────
        Event::CreateNote {
            space_id,
            parent_id,
        } => {
            // Generate a unique slug from the current timestamp. Title will be
            // synced from the first `# Heading` line when the note is saved. [S-DM-N5]
            use std::time::{SystemTime, UNIX_EPOCH};
            let ts = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();
            let id_str = format!("{}/untitled-{}", space_id.as_str(), ts);
            match NoteId::new(id_str) {
                Err(e) => {
                    model.error = Some(e.to_string());
                    vec![Effect::Render]
                }
                Ok(id) => {
                    let meta = NoteMetadata::new("", Some(space_id));
                    let note = Note {
                        id,
                        metadata: meta,
                        content: String::new(),
                        parent_id,
                    };
                    vec![Effect::Storage(StorageRequest::SaveNote { note })]
                }
            }
        }

        Event::UpdateNote {
            id,
            content,
            labels,
        } => {
            if let Some(note) = model.current_note.as_mut() {
                if note.id == id {
                    // Start from labels provided by the UI metadata panel.
                    let mut effective_labels = labels_from_strings(&labels);
                    // Apply /:labels commands from content (may override panel labels). [S-UX-NE2]
                    note.content = apply_label_commands(&content, &mut effective_labels);
                    note.metadata.labels = effective_labels;
                    // Sync title from first # heading in content. [S-DM-N5]
                    if let Some(title) = extract_title(&note.content) {
                        note.metadata.title = slug(&title);
                    }
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

        Event::NoteListLoaded { space_id, note_ids } => {
            model.current_space = model.spaces.iter().find(|s| s.id == space_id).cloned();
            model
                .notes
                .retain(|n| n.id.space_segment() == space_id.as_str());
            model.loading = false;
            // Load each note into the list cache. [S-UX-NLV1]
            let mut effects: Vec<Effect> = note_ids
                .into_iter()
                .map(|id| Effect::Storage(StorageRequest::LoadNoteForList { id }))
                .collect();
            effects.push(Effect::Render);
            effects
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

        Event::NoteListItemLoaded { note } => {
            // Upsert note into the list cache without navigating to the editor.
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

/// Extract the first `# Heading` from markdown content. [S-DM-N5]
fn extract_title(content: &str) -> Option<String> {
    content
        .lines()
        .find(|l| l.starts_with("# "))
        .map(|l| l[2..].trim().to_string())
        .filter(|s| !s.is_empty())
}

/// Process inline `/:labels tag1 tag2;` commands in content. [S-UX-NE2]
///
/// Labels from the command are **merged** (union) with the panel labels already
/// in `labels`. Duplicates are removed while preserving order (panel labels first,
/// then any new labels from the command that aren't already present).
fn apply_label_commands(content: &str, labels: &mut Vec<Label>) -> String {
    let mut result = String::with_capacity(content.len());
    for line in content.lines() {
        let trimmed = line.trim();
        if let Some(rest) = trimmed.strip_prefix("/:labels ") {
            if let Some(args) = rest.strip_suffix(';') {
                // Merge command labels into panel labels (union, deduplicated). [S-UX-NE2]
                for s in args.split_whitespace().filter(|s| !s.is_empty()) {
                    let lbl = Label(s.to_string());
                    if !labels.contains(&lbl) {
                        labels.push(lbl);
                    }
                }
                // Don't include the command line in the stored content.
                continue;
            }
        }
        result.push_str(line);
        result.push('\n');
    }
    result // [S-UX-NE5] preserve trailing whitespace; no normalization during editing
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
            note_count: 0,
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
    fn trailing_newlines_preserved_during_autosave() {
        // [S-UX-NE5] Content fidelity: trailing whitespace must not be stripped.
        let content = "# My Note\n\nSome content.\n\n";
        let mut labels = vec![];
        let result = apply_label_commands(content, &mut labels);
        assert!(result.ends_with('\n'), "trailing newline must be preserved");
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
            note_count: 0,
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

    // ── Corrected existing test (TC-AL-LIFE-01) ───────────────────────────────

    /// TC-AL-LIFE-01 — AppStarted with folder emits both LoadSettings and LoadSpaces
    #[test]
    fn app_started_with_folder_requests_settings_and_spaces() {
        let mut model = fresh_model();
        let effects = update(
            Event::AppStarted {
                data_folder: Some("/data".into()),
            },
            &mut model,
        );
        assert!(effects
            .iter()
            .any(|e| matches!(e, Effect::Storage(StorageRequest::LoadSettings))));
        assert!(effects
            .iter()
            .any(|e| matches!(e, Effect::Storage(StorageRequest::LoadSpaces))));
    }

    // ── Lifecycle (TC-AL-LIFE-03, TC-AL-LIFE-04) ─────────────────────────────

    /// TC-AL-LIFE-03 — DataFolderSelected triggers SaveSettings + LoadSpaces
    #[test]
    fn data_folder_selected_saves_settings_and_loads_spaces() {
        let mut model = fresh_model();
        let effects = update(
            Event::DataFolderSelected {
                path: "/chosen/path".into(),
            },
            &mut model,
        );
        assert!(
            effects
                .iter()
                .any(|e| matches!(e, Effect::Storage(StorageRequest::SaveSettings { .. }))),
            "expected SaveSettings effect"
        );
        assert!(
            effects
                .iter()
                .any(|e| matches!(e, Effect::Storage(StorageRequest::LoadSpaces))),
            "expected LoadSpaces effect"
        );
        assert_eq!(model.data_folder.as_deref(), Some("/chosen/path"));
    }

    /// TC-AL-LIFE-04 — SettingsLoaded stores data_folder in model
    #[test]
    fn settings_loaded_stores_data_folder() {
        let mut model = fresh_model();
        update(
            Event::SettingsLoaded {
                settings: shared_types::model::Settings {
                    data_folder: Some("/persisted/path".into()),
                    ..Default::default()
                },
            },
            &mut model,
        );
        assert_eq!(model.data_folder.as_deref(), Some("/persisted/path"));
    }

    // ── Navigation (TC-AL-NAV-01, TC-AL-NAV-02, TC-AL-NAV-04) ───────────────

    /// TC-AL-NAV-01 — NavigateToNote emits LoadNote effect
    #[test]
    fn navigate_to_note_emits_load_note() {
        let mut model = fresh_model();
        let id = NoteId::new("space1/note1").unwrap();
        let effects = update(Event::NavigateToNote { id: id.clone() }, &mut model);
        assert!(effects.iter().any(|e| matches!(
            e,
            Effect::Storage(StorageRequest::LoadNote { id: req_id }) if *req_id == id
        )));
    }

    /// TC-AL-NAV-02 — NavigateToSpace emits LoadNotes effect
    #[test]
    fn navigate_to_space_emits_load_notes() {
        let mut model = fresh_model();
        let id = SpaceId::new("space1").unwrap();
        let effects = update(Event::NavigateToSpace { id: id.clone() }, &mut model);
        assert!(effects.iter().any(|e| matches!(
            e,
            Effect::Storage(StorageRequest::LoadNotes { space_id }) if *space_id == id
        )));
    }

    /// TC-AL-NAV-04 — NavigateOverview sets active tab in viewmodel
    #[test]
    fn navigate_overview_sets_active_tab() {
        let mut model = fresh_model();
        model.spaces = vec![]; // overview state
        update(
            Event::NavigateOverview {
                tab: OverviewTabRequest::Labels,
            },
            &mut model,
        );
        let vm = view(&model);
        if let ViewModel::Overview(ov) = vm {
            assert!(
                matches!(ov.active_tab, OverviewTab::Labels),
                "expected Labels tab"
            );
        } else {
            panic!("expected Overview viewmodel");
        }
    }

    // ── Space management (TC-AL-SP-02, TC-AL-SP-03) ──────────────────────────

    /// TC-AL-SP-02 — SpaceCreated inserts space into model and renders (no LoadSpaces)
    #[test]
    fn space_created_inserts_and_renders() {
        let mut model = fresh_model();
        let space = Space {
            id: SpaceId::new("new-space").unwrap(),
            name: "New Space".into(),
            description: None,
            labels: vec![],
            parent_id: None,
            note_count: 0,
        };
        let effects = update(
            Event::SpaceCreated {
                space: space.clone(),
            },
            &mut model,
        );
        assert_eq!(model.spaces.len(), 1);
        assert_eq!(model.spaces[0].id, space.id);
        assert!(effects.iter().any(|e| matches!(e, Effect::Render)));
        // Must NOT trigger a LoadSpaces roundtrip
        assert!(
            !effects
                .iter()
                .any(|e| matches!(e, Effect::Storage(StorageRequest::LoadSpaces))),
            "SpaceCreated should not trigger LoadSpaces"
        );
    }

    /// TC-AL-SP-03 — DeleteSpace emits StorageRequest::DeleteSpace
    #[test]
    fn delete_space_emits_storage_effect() {
        let mut model = fresh_model();
        let id = SpaceId::new("my-space").unwrap();
        let effects = update(Event::DeleteSpace { id: id.clone() }, &mut model);
        assert!(effects.iter().any(|e| matches!(
            e,
            Effect::Storage(StorageRequest::DeleteSpace { id: req_id }) if *req_id == id
        )));
    }

    // ── Note management (TC-AL-N-02..04, TC-AL-N-06..10) ─────────────────────

    fn loaded_note_model(space_id: &SpaceId, note_id: NoteId) -> Model {
        let mut model = fresh_model();
        let mut meta = NoteMetadata::new("old-title", Some(space_id.clone()));
        meta.labels = vec![Label("panel-tag".to_string())];
        meta.draft = true;
        let note = Note {
            id: note_id.clone(),
            metadata: meta,
            content: "# old-title\n\nBody.".into(),
            parent_id: None,
        };
        model.current_note = Some(note);
        model.screen = Screen::NoteEditor;
        model
    }

    /// TC-AL-N-02 — UpdateNote syncs title from first heading [S-DM-N5]
    #[test]
    fn update_note_syncs_title_from_heading() {
        let space_id = SpaceId::new("space1").unwrap();
        let note_id = NoteId::new("space1/note1").unwrap();
        let mut model = loaded_note_model(&space_id, note_id.clone());
        let effects = update(
            Event::UpdateNote {
                id: note_id,
                content: "# My New Title\n\nBody.".into(),
                labels: vec![],
            },
            &mut model,
        );
        if let Some(Effect::Storage(StorageRequest::SaveNote { note })) = effects
            .iter()
            .find(|e| matches!(e, Effect::Storage(StorageRequest::SaveNote { .. })))
        {
            assert_eq!(note.metadata.title, "my-new-title");
        } else {
            panic!("expected SaveNote effect");
        }
    }

    /// TC-AL-N-03 — UpdateNote without heading leaves title unchanged [S-DM-N5]
    #[test]
    fn update_note_no_heading_preserves_title() {
        let space_id = SpaceId::new("space1").unwrap();
        let note_id = NoteId::new("space1/note1").unwrap();
        let mut model = loaded_note_model(&space_id, note_id.clone());
        let effects = update(
            Event::UpdateNote {
                id: note_id,
                content: "No heading here".into(),
                labels: vec![],
            },
            &mut model,
        );
        if let Some(Effect::Storage(StorageRequest::SaveNote { note })) = effects
            .iter()
            .find(|e| matches!(e, Effect::Storage(StorageRequest::SaveNote { .. })))
        {
            assert_eq!(note.metadata.title, "old-title");
        } else {
            panic!("expected SaveNote effect");
        }
    }

    /// TC-AL-N-04 — UpdateNote applies panel labels [S-DM-N5]
    #[test]
    fn update_note_applies_panel_labels() {
        let space_id = SpaceId::new("space1").unwrap();
        let note_id = NoteId::new("space1/note1").unwrap();
        let mut model = loaded_note_model(&space_id, note_id.clone());
        let effects = update(
            Event::UpdateNote {
                id: note_id,
                content: "# old-title\n\nBody.".into(),
                labels: vec!["rust".into(), "learning".into()],
            },
            &mut model,
        );
        if let Some(Effect::Storage(StorageRequest::SaveNote { note })) = effects
            .iter()
            .find(|e| matches!(e, Effect::Storage(StorageRequest::SaveNote { .. })))
        {
            let labels: Vec<&str> = note.metadata.labels.iter().map(|l| l.0.as_str()).collect();
            assert!(labels.contains(&"rust"));
            assert!(labels.contains(&"learning"));
        } else {
            panic!("expected SaveNote effect");
        }
    }

    /// TC-AL-N-06 — `/:labels` in content merges with panel labels [S-UX-NE2]
    #[test]
    fn label_command_merges_with_panel_labels() {
        let content = "# My Note\n\n/:labels content-tag;\n\nReal content.";
        let mut labels = vec![Label("panel-tag".to_string())];
        let result = apply_label_commands(content, &mut labels);
        assert!(
            !result.contains("/:labels"),
            "command line must be stripped"
        );
        let label_names: Vec<&str> = labels.iter().map(|l| l.0.as_str()).collect();
        assert!(
            label_names.contains(&"panel-tag"),
            "panel label must be kept"
        );
        assert!(
            label_names.contains(&"content-tag"),
            "content label must be added"
        );
        // No duplicates
        assert_eq!(
            labels.len(),
            label_names
                .iter()
                .collect::<std::collections::HashSet<_>>()
                .len()
        );
    }

    /// TC-AL-N-07 — PublishNote clears draft flag [S-DM-N5]
    #[test]
    fn publish_note_clears_draft() {
        let space_id = SpaceId::new("space1").unwrap();
        let note_id = NoteId::new("space1/note1").unwrap();
        let mut model = loaded_note_model(&space_id, note_id.clone());
        let effects = update(Event::PublishNote { id: note_id }, &mut model);
        if let Some(Effect::Storage(StorageRequest::SaveNote { note })) = effects
            .iter()
            .find(|e| matches!(e, Effect::Storage(StorageRequest::SaveNote { .. })))
        {
            assert!(!note.metadata.draft);
        } else {
            panic!("expected SaveNote effect");
        }
    }

    /// TC-AL-N-08 — DeleteNote emits StorageRequest::DeleteNote
    #[test]
    fn delete_note_emits_storage_effect() {
        let mut model = fresh_model();
        let id = NoteId::new("space1/note1").unwrap();
        let effects = update(Event::DeleteNote { id: id.clone() }, &mut model);
        assert!(effects.iter().any(|e| matches!(
            e,
            Effect::Storage(StorageRequest::DeleteNote { id: req_id }) if *req_id == id
        )));
    }

    /// TC-AL-N-09 — NoteDeleted transitions screen away from NoteEditor
    #[test]
    fn note_deleted_transitions_screen() {
        let space_id = SpaceId::new("space1").unwrap();
        let note_id = NoteId::new("space1/note1").unwrap();
        let mut model = loaded_note_model(&space_id, note_id.clone());
        let effects = update(Event::NoteDeleted { id: note_id }, &mut model);
        assert!(!matches!(model.screen, Screen::NoteEditor));
        assert!(effects.iter().any(|e| matches!(e, Effect::Render)));
    }

    /// TC-AL-N-10 — NoteLoaded transitions model to NoteEditor screen
    #[test]
    fn note_loaded_transitions_to_editor() {
        let mut model = fresh_model();
        let mut meta = NoteMetadata::new("loaded-note", Some(SpaceId::new("space1").unwrap()));
        meta.draft = false;
        let note = Note {
            id: NoteId::new("space1/loaded-note").unwrap(),
            metadata: meta,
            content: "# loaded-note\n\nContent.".into(),
            parent_id: None,
        };
        let effects = update(Event::NoteLoaded { note }, &mut model);
        assert!(matches!(model.screen, Screen::NoteEditor));
        assert!(model.current_note.is_some());
        assert!(effects.iter().any(|e| matches!(e, Effect::Render)));
    }

    // ── Note description (TC-AL-ND-01, TC-AL-ND-02) ──────────────────────────

    fn model_with_note_content(content: &str) -> Model {
        let space_id = SpaceId::new("space1").unwrap();
        let mut model = fresh_model();
        model.screen = Screen::NoteEditor;
        let mut meta = NoteMetadata::new("my-note", Some(space_id));
        meta.draft = false;
        model.current_note = Some(Note {
            id: NoteId::new("space1/my-note").unwrap(),
            metadata: meta,
            content: content.into(),
            parent_id: None,
        });
        model
    }

    /// TC-AL-ND-01 — Note description is first non-heading, non-empty line [S-DM-N4]
    #[test]
    fn note_description_is_first_paragraph() {
        let model =
            model_with_note_content("# My Note\n\nFirst paragraph text.\n\nSecond paragraph.");
        if let ViewModel::NoteEditor(vm) = view(&model) {
            assert_eq!(vm.description.as_deref(), Some("First paragraph text."));
        } else {
            panic!("expected NoteEditor viewmodel");
        }
    }

    /// TC-AL-ND-02 — Note with only heading has empty/None description [S-DM-N4]
    #[test]
    fn note_description_only_heading_is_empty() {
        let model = model_with_note_content("# My Note\n");
        if let ViewModel::NoteEditor(vm) = view(&model) {
            let desc = vm.description.as_deref().unwrap_or("");
            assert!(
                desc.is_empty(),
                "expected empty description, got: {:?}",
                desc
            );
        } else {
            panic!("expected NoteEditor viewmodel");
        }
    }

    // ── Search and filtering (TC-AL-SF-02..07) ───────────────────────────────

    fn notes_in_model(specs: &[(&str, &[&str])]) -> Model {
        // specs: (title, &[labels])
        let space_id = SpaceId::new("space1").unwrap();
        let mut model = fresh_model();
        model.screen = Screen::NoteList;
        model.current_space = Some(Space {
            id: space_id.clone(),
            name: "Space1".into(),
            description: None,
            labels: vec![],
            parent_id: None,
            note_count: 0,
        });
        for (title, labels) in specs {
            let mut meta = NoteMetadata::new(*title, Some(space_id.clone()));
            meta.labels = labels.iter().map(|l| Label(l.to_string())).collect();
            meta.draft = false;
            model.notes.push(Note {
                id: NoteId::new(format!("space1/{title}")).unwrap(),
                metadata: meta,
                content: format!("# {title}"),
                parent_id: None,
            });
        }
        model
    }

    fn note_titles_in_vm(model: &Model) -> Vec<String> {
        if let ViewModel::NoteList(vm) = view(model) {
            vm.notes.iter().map(|n| n.title.clone()).collect()
        } else {
            panic!("expected NoteList viewmodel");
        }
    }

    /// TC-AL-SF-02 — SetActiveView filters notes by label [S-DM-V1]
    #[test]
    fn set_active_view_filters_by_label() {
        let mut model = notes_in_model(&[
            ("note-a", &["rust"]),
            ("note-b", &["python"]),
            ("note-c", &["rust", "learning"]),
        ]);
        update(
            Event::SetActiveView {
                labels: vec!["rust".into()],
            },
            &mut model,
        );
        let titles = note_titles_in_vm(&model);
        assert!(titles.contains(&"note-a".to_string()));
        assert!(titles.contains(&"note-c".to_string()));
        assert!(!titles.contains(&"note-b".to_string()));
    }

    /// TC-AL-SF-03 — SetActiveView with multiple labels requires ALL labels [S-DM-V1]
    #[test]
    fn set_active_view_requires_all_labels() {
        let mut model = notes_in_model(&[
            ("note-a", &["rust", "learning"]),
            ("note-b", &["rust"]),
            ("note-c", &["learning"]),
        ]);
        update(
            Event::SetActiveView {
                labels: vec!["rust".into(), "learning".into()],
            },
            &mut model,
        );
        let titles = note_titles_in_vm(&model);
        assert_eq!(titles, vec!["note-a"]);
    }

    /// TC-AL-SF-04 — ClearView restores all notes
    #[test]
    fn clear_view_restores_all_notes() {
        let mut model = notes_in_model(&[("note-a", &["rust"]), ("note-b", &["python"])]);
        update(
            Event::SetActiveView {
                labels: vec!["rust".into()],
            },
            &mut model,
        );
        update(Event::ClearView, &mut model);
        let titles = note_titles_in_vm(&model);
        assert_eq!(titles.len(), 2);
    }

    /// TC-AL-SF-05 — Search and active view can combine
    #[test]
    fn search_and_active_view_combine() {
        let mut model = notes_in_model(&[
            ("intro", &["rust"]),
            ("advanced", &["rust"]),
            ("intro-py", &["python"]),
        ]);
        update(
            Event::SetActiveView {
                labels: vec!["rust".into()],
            },
            &mut model,
        );
        update(
            Event::SearchChanged {
                query: "intro".into(),
            },
            &mut model,
        );
        let titles = note_titles_in_vm(&model);
        assert_eq!(titles, vec!["intro"]);
    }

    /// TC-AL-SF-06 — Empty search query shows all notes
    #[test]
    fn empty_search_query_shows_all() {
        let mut model = notes_in_model(&[("note-a", &["rust"]), ("note-b", &["python"])]);
        update(
            Event::SearchChanged {
                query: "note-a".into(),
            },
            &mut model,
        );
        update(Event::SearchChanged { query: "".into() }, &mut model);
        let titles = note_titles_in_vm(&model);
        assert_eq!(titles.len(), 2);
    }

    /// TC-AL-SF-07 — Available labels derived from cached notes [S-DM-L2]
    #[test]
    fn label_summaries_derived_from_notes() {
        let mut model = notes_in_model(&[
            ("note-a", &["rust"]),
            ("note-b", &["python"]),
            ("note-c", &["rust"]),
        ]);
        // Move to overview so label summaries appear in the viewmodel.
        model.screen = Screen::Overview(OverviewTab::Labels);
        let vm = view(&model);
        if let ViewModel::Overview(ov) = vm {
            let labels: Vec<&str> = ov.labels.iter().map(|l| l.label.as_str()).collect();
            assert!(labels.contains(&"rust"));
            assert!(labels.contains(&"python"));
            // rust appears twice (note-a and note-c)
            let rust_entry = ov.labels.iter().find(|l| l.label == "rust").unwrap();
            assert_eq!(rust_entry.note_count, 2);
        } else {
            panic!("expected Overview viewmodel");
        }
    }

    // ── Effect errors (TC-AL-ERR-01, TC-AL-ERR-02) ───────────────────────────

    /// TC-AL-ERR-01 — EffectError transitions model to Error viewmodel
    #[test]
    fn effect_error_produces_error_viewmodel() {
        let mut model = fresh_model();
        update(
            Event::EffectError {
                message: "disk full".into(),
            },
            &mut model,
        );
        let vm = view(&model);
        assert!(
            matches!(vm, ViewModel::Error { message } if message.contains("disk full")),
            "expected Error viewmodel with 'disk full'"
        );
    }

    /// TC-AL-ERR-02 — NavigateBack from error screen returns to overview
    #[test]
    fn navigate_back_from_error_goes_to_overview() {
        let mut model = fresh_model();
        model.error = Some("some error".into());
        // Make sure loading is false so viewmodel reflects error state, not loading
        model.loading = false;
        update(Event::NavigateBack, &mut model);
        // After NavigateBack, error should be cleared and we should be in overview.
        let vm = view(&model);
        assert!(
            matches!(vm, ViewModel::Overview(_) | ViewModel::Loading),
            "expected Overview or Loading after NavigateBack from error, got {:?}",
            vm
        );
    }
}
