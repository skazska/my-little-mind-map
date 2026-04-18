use crux_core::Core;
use shared::model::{Note, NoteReference, ReferenceType, SourceType, Topic};
use shared::{Event, MindMap, ViewModel};
use storage::StorageHandle;
use tauri::{Manager, State};
use uuid::Uuid;

fn parse_topic_relation_type(value: &str) -> Result<shared::model::TopicRelationType, String> {
    let json_value = serde_json::to_string(value)
        .map_err(|e| format!("Failed to prepare relation type '{value}' for parsing: {e}"))?;
    serde_json::from_str::<shared::model::TopicRelationType>(&json_value)
        .map_err(|e| format!("Invalid relation type '{value}': {e}"))
}

struct AppState {
    core: Core<MindMap>,
    storage: StorageHandle,
}

/// Reload all data from storage into the CRUX model and return the updated view.
fn reload_data(state: &AppState) -> Result<ViewModel, String> {
    let notes = storage::notes::list_full_notes(&state.storage).map_err(|e| e.to_string())?;
    let topics = storage::topics::list_topics(&state.storage).map_err(|e| e.to_string())?;
    let classifications =
        storage::relations::load_all_classifications(&state.storage).map_err(|e| e.to_string())?;
    let note_references =
        storage::relations::load_all_references(&state.storage).map_err(|e| e.to_string())?;
    let topic_relations =
        storage::relations::load_all_topic_relations(&state.storage).map_err(|e| e.to_string())?;

    let _ = state.core.process_event(Event::DataLoaded {
        notes,
        topics,
        classifications,
        note_references,
        topic_relations,
    });

    Ok(state.core.view())
}

fn parse_uuids(ids: &[String]) -> Result<Vec<Uuid>, String> {
    ids.iter()
        .map(|s| Uuid::parse_str(s).map_err(|e| format!("Invalid UUID '{s}': {e}")))
        .collect()
}

#[tauri::command]
fn get_view(state: State<'_, AppState>) -> ViewModel {
    state.core.view()
}

#[tauri::command]
fn initialize(state: State<'_, AppState>) -> Result<ViewModel, String> {
    reload_data(&state)
}

#[tauri::command]
fn create_note(
    title: String,
    content: String,
    content_ast: String,
    topic_ids: Vec<String>,
    state: State<'_, AppState>,
) -> Result<ViewModel, String> {
    let topic_uuids = parse_uuids(&topic_ids)?;

    if topic_uuids.is_empty() {
        return Err("At least one topic is required".into());
    }

    // Verify all topics exist in storage
    for tid in &topic_uuids {
        storage::topics::read_topic(&state.storage, tid)
            .map_err(|_| format!("Topic {tid} not found"))?;
    }

    // Create note with AST
    let mut note = Note::new(title, content, SourceType::Typed);
    note.content_ast =
        serde_json::from_str(&content_ast).map_err(|e| format!("Invalid content_ast JSON: {e}"))?;

    let note_id = note.id;

    // Persist note to storage
    storage::notes::create_note(&state.storage, &note).map_err(|e| e.to_string())?;

    // Create classifications
    for tid in &topic_uuids {
        storage::relations::classify_note(&state.storage, note_id, *tid)
            .map_err(|e| e.to_string())?;
    }

    // Extract and persist references from content
    let refs = shared::references::extract_references(&note.content_raw);
    for (target_id, _text) in &refs {
        if *target_id == note_id {
            continue; // skip self-links
        }
        let reference = NoteReference::new(note_id, *target_id, ReferenceType::LinksTo);
        match storage::relations::add_reference(&state.storage, &reference) {
            Ok(()) => {}
            Err(storage::StorageError::AlreadyExists(_)) => {} // duplicate ref in content, ignore
            Err(e) => return Err(e.to_string()),
        }
    }

    // Sync CRUX model
    reload_data(&state)
}

#[tauri::command]
fn update_note(
    id: String,
    title: String,
    content: String,
    content_ast: String,
    topic_ids: Vec<String>,
    state: State<'_, AppState>,
) -> Result<ViewModel, String> {
    let note_id = Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    let topic_uuids = parse_uuids(&topic_ids)?;

    if topic_uuids.is_empty() {
        return Err("At least one topic is required".into());
    }

    let mut note =
        storage::notes::read_note(&state.storage, &note_id).map_err(|e| e.to_string())?;

    note.title = title;
    note.content_raw = content;
    note.content_ast =
        serde_json::from_str(&content_ast).map_err(|e| format!("Invalid content_ast JSON: {e}"))?;
    note.updated_at = chrono::Utc::now();
    note.version += 1;

    storage::notes::update_note(&state.storage, &note).map_err(|e| e.to_string())?;

    // Update classifications: remove old, add new
    storage::relations::remove_note_classifications(&state.storage, note_id)
        .map_err(|e| e.to_string())?;
    for tid in &topic_uuids {
        storage::relations::classify_note(&state.storage, note_id, *tid)
            .map_err(|e| e.to_string())?;
    }

    // Update references: remove only outbound refs, then re-add
    storage::relations::remove_outbound_references(&state.storage, note_id)
        .map_err(|e| e.to_string())?;
    let refs = shared::references::extract_references(&note.content_raw);
    for (target_id, _text) in &refs {
        if *target_id == note_id {
            continue; // skip self-links
        }
        let reference = NoteReference::new(note_id, *target_id, ReferenceType::LinksTo);
        match storage::relations::add_reference(&state.storage, &reference) {
            Ok(()) => {}
            Err(storage::StorageError::AlreadyExists(_)) => {} // duplicate, ignore
            Err(e) => return Err(e.to_string()),
        }
    }

    // Sync CRUX model
    reload_data(&state)
}

#[tauri::command]
fn delete_note(id: String, state: State<'_, AppState>) -> Result<ViewModel, String> {
    let note_id = Uuid::parse_str(&id).map_err(|e| e.to_string())?;

    // Clean up classifications and references
    let _ = storage::relations::remove_note_classifications(&state.storage, note_id);
    let _ = storage::relations::remove_note_references(&state.storage, note_id);

    storage::notes::delete_note(&state.storage, &note_id).map_err(|e| e.to_string())?;

    reload_data(&state)
}

#[tauri::command]
fn create_topic(
    name: String,
    description: Option<String>,
    state: State<'_, AppState>,
) -> Result<ViewModel, String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("Topic name is required".into());
    }
    let topic = Topic::new(trimmed.to_string(), description);
    storage::topics::create_topic(&state.storage, &topic).map_err(|e| e.to_string())?;
    reload_data(&state)
}

#[tauri::command]
fn update_topic(
    id: String,
    name: String,
    description: Option<String>,
    state: State<'_, AppState>,
) -> Result<ViewModel, String> {
    let topic_id = Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("Topic name is required".into());
    }

    let mut topic =
        storage::topics::read_topic(&state.storage, &topic_id).map_err(|e| e.to_string())?;
    topic.name = trimmed.to_string();
    topic.description = description;
    topic.updated_at = chrono::Utc::now();
    topic.version += 1;

    storage::topics::update_topic(&state.storage, &topic).map_err(|e| e.to_string())?;
    reload_data(&state)
}

#[tauri::command]
fn delete_topic(id: String, state: State<'_, AppState>) -> Result<ViewModel, String> {
    let topic_id = Uuid::parse_str(&id).map_err(|e| e.to_string())?;

    // D-011 guard: deleting a topic must not leave any note unclassified.
    let all_classifications =
        storage::relations::load_all_classifications(&state.storage).map_err(|e| e.to_string())?;

    // Precompute per-note topic sets for O(n) instead of O(n*m)
    let mut note_topics: std::collections::HashMap<Uuid, std::collections::HashSet<Uuid>> =
        std::collections::HashMap::new();
    let mut affected_note_ids: Vec<Uuid> = Vec::new();
    for c in &all_classifications {
        note_topics.entry(c.note_id).or_default().insert(c.topic_id);
        if c.topic_id == topic_id {
            affected_note_ids.push(c.note_id);
        }
    }

    for note_id in affected_note_ids {
        let has_other_topic = note_topics
            .get(&note_id)
            .is_some_and(|topics| topics.iter().any(|tid| *tid != topic_id));
        if !has_other_topic {
            return Err(
                "Cannot delete topic because at least one note would have no topics assigned"
                    .into(),
            );
        }
    }

    storage::relations::remove_topic_classifications(&state.storage, topic_id)
        .map_err(|e| e.to_string())?;
    storage::relations::remove_topic_all_relations(&state.storage, topic_id)
        .map_err(|e| e.to_string())?;
    storage::topics::delete_topic(&state.storage, &topic_id).map_err(|e| e.to_string())?;

    reload_data(&state)
}

#[tauri::command]
fn add_topic_relation(
    source_topic_id: String,
    target_topic_id: String,
    relation_type: String,
    state: State<'_, AppState>,
) -> Result<ViewModel, String> {
    let source_id = Uuid::parse_str(&source_topic_id).map_err(|e| e.to_string())?;
    let target_id = Uuid::parse_str(&target_topic_id).map_err(|e| e.to_string())?;
    let parsed_type = parse_topic_relation_type(&relation_type)?;

    // Validate both topics exist before creating relation
    storage::topics::read_topic(&state.storage, &source_id)
        .map_err(|_| format!("Source topic not found: {source_topic_id}"))?;
    storage::topics::read_topic(&state.storage, &target_id)
        .map_err(|_| format!("Target topic not found: {target_topic_id}"))?;

    let rel = shared::model::TopicRelation::new(source_id, target_id, parsed_type);

    storage::relations::add_topic_relation(&state.storage, &rel).map_err(|e| e.to_string())?;
    reload_data(&state)
}

#[tauri::command]
fn remove_topic_relation(
    source_topic_id: String,
    target_topic_id: String,
    state: State<'_, AppState>,
) -> Result<ViewModel, String> {
    let source_id = Uuid::parse_str(&source_topic_id).map_err(|e| e.to_string())?;
    let target_id = Uuid::parse_str(&target_topic_id).map_err(|e| e.to_string())?;

    storage::relations::remove_topic_relation(&state.storage, source_id, target_id)
        .map_err(|e| e.to_string())?;
    reload_data(&state)
}

#[tauri::command]
fn get_storage_path(state: State<'_, AppState>) -> String {
    state.storage.root().display().to_string()
}

#[tauri::command]
fn select_topic(id: String, state: State<'_, AppState>) -> Result<ViewModel, String> {
    let topic_id = Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    let view = state.core.view();
    if !view.topics.iter().any(|t| t.id == topic_id) {
        return Err(format!("Topic '{id}' not found"));
    }
    let _ = state
        .core
        .process_event(Event::SelectTopic { id: topic_id });
    Ok(state.core.view())
}

#[tauri::command]
fn clear_topic_filter(state: State<'_, AppState>) -> ViewModel {
    let _ = state.core.process_event(Event::ClearTopicFilter);
    state.core.view()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to resolve app data directory")
                .join("data");

            let storage_handle =
                storage::init_storage(&data_dir).expect("Failed to initialize storage");

            app.manage(AppState {
                core: Core::new(),
                storage: storage_handle,
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_view,
            initialize,
            create_note,
            update_note,
            delete_note,
            create_topic,
            update_topic,
            delete_topic,
            add_topic_relation,
            remove_topic_relation,
            select_topic,
            clear_topic_filter,
            get_storage_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
