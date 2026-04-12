use crux_core::Core;
use shared::model::{Note, NoteReference, ReferenceType, SourceType, Topic};
use shared::{Event, MindMap, ViewModel};
use storage::StorageHandle;
use tauri::{Manager, State};
use uuid::Uuid;

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
    note.content_ast = serde_json::from_str(&content_ast).unwrap_or(serde_json::Value::Null);

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
        let reference = NoteReference::new(note_id, *target_id, ReferenceType::LinksTo);
        // Ignore errors for references to non-existent notes
        let _ = storage::relations::add_reference(&state.storage, &reference);
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
    state: State<'_, AppState>,
) -> Result<ViewModel, String> {
    let note_id = Uuid::parse_str(&id).map_err(|e| e.to_string())?;

    let mut note =
        storage::notes::read_note(&state.storage, &note_id).map_err(|e| e.to_string())?;

    note.title = title;
    note.content_raw = content;
    note.content_ast = serde_json::from_str(&content_ast).unwrap_or(serde_json::Value::Null);
    note.updated_at = chrono::Utc::now();
    note.version += 1;

    storage::notes::update_note(&state.storage, &note).map_err(|e| e.to_string())?;

    // Update references: remove old, add new
    let _ = storage::relations::remove_note_references(&state.storage, note_id);
    let refs = shared::references::extract_references(&note.content_raw);
    for (target_id, _text) in &refs {
        let reference = NoteReference::new(note_id, *target_id, ReferenceType::LinksTo);
        let _ = storage::relations::add_reference(&state.storage, &reference);
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
    let topic = Topic::new(name, description);
    storage::topics::create_topic(&state.storage, &topic).map_err(|e| e.to_string())?;
    reload_data(&state)
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
