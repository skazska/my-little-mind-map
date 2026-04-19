use crux_core::Core;
use serde::Serialize;
use shared::model::{Note, NoteReference, ReferenceType, SourceType, Topic};
use shared::{Event, MindMap, ViewModel};
use storage::StorageHandle;
use tauri::{Manager, State};
use uuid::Uuid;

const MAX_UPLOAD_SIZE: u64 = 50 * 1024 * 1024; // 50 MB

fn mime_type_from_extension(path: &std::path::Path) -> &'static str {
    match path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .as_deref()
    {
        Some("png") => "image/png",
        Some("jpg" | "jpeg") => "image/jpeg",
        Some("gif") => "image/gif",
        Some("webp") => "image/webp",
        Some("pdf") => "application/pdf",
        Some("txt") => "text/plain",
        Some("svg") => "image/svg+xml",
        _ => "application/octet-stream",
    }
}

fn is_image_mime(mime: &str) -> bool {
    mime.starts_with("image/")
}

fn extension_from_mime(mime: &str) -> &'static str {
    match mime {
        "image/png" => "png",
        "image/jpeg" => "jpg",
        "image/gif" => "gif",
        "image/webp" => "webp",
        _ => "bin",
    }
}

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

    // Clean up classifications
    let _ = storage::relations::remove_note_classifications(&state.storage, note_id);

    // Remove outbound references (source note is being deleted)
    let _ = storage::relations::remove_outbound_references(&state.storage, note_id);

    // Mark inbound references as broken (so backlinks panels show the target was deleted)
    let _ = storage::relations::mark_target_references_broken(&state.storage, note_id);

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

/// Sanitize a display name for use inside markdown link/image syntax.
/// Escapes characters that would break `[text](url)` or `![alt](url)` patterns.
fn sanitize_markdown_link_text(text: &str) -> String {
    text.replace('\\', "\\\\")
        .replace('[', "\\[")
        .replace(']', "\\]")
        .replace('\n', " ")
        .replace('\r', "")
}

/// Append an asset markdown reference at the end of the note content and persist.
fn insert_asset_reference_and_save(
    state: &AppState,
    note_id: Uuid,
    stored_name: &str,
    display_name: &str,
    mime_type: &str,
) -> Result<(), String> {
    let mut note =
        storage::notes::read_note(&state.storage, &note_id).map_err(|e| e.to_string())?;

    let safe_name = sanitize_markdown_link_text(display_name);
    let reference_line = if is_image_mime(mime_type) {
        format!("\n![{safe_name}](assets/{stored_name})")
    } else {
        format!("\n[{safe_name}](assets/{stored_name})")
    };

    note.content_raw.push_str(&reference_line);
    note.updated_at = chrono::Utc::now();
    note.version += 1;
    storage::notes::update_note(&state.storage, &note).map_err(|e| e.to_string())?;
    Ok(())
}

/// Compute the stored filename that the storage layer uses for a given asset.
fn asset_stored_name(asset_id: Uuid, original_filename: &str) -> String {
    let ext = std::path::Path::new(original_filename)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");
    if ext.is_empty() {
        asset_id.to_string()
    } else {
        format!("{asset_id}.{ext}")
    }
}

#[tauri::command]
fn upload_asset(
    note_id: String,
    file_path: String,
    state: State<'_, AppState>,
) -> Result<ViewModel, String> {
    let nid = Uuid::parse_str(&note_id).map_err(|e| e.to_string())?;
    let path = std::path::PathBuf::from(&file_path);

    if !path.exists() {
        return Err(format!("File not found: {file_path}"));
    }

    let metadata = std::fs::metadata(&path).map_err(|e| e.to_string())?;
    if metadata.len() > MAX_UPLOAD_SIZE {
        return Err(format!(
            "File too large ({} MB). Maximum is {} MB.",
            metadata.len() / (1024 * 1024),
            MAX_UPLOAD_SIZE / (1024 * 1024)
        ));
    }

    let filename = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("upload.bin")
        .to_string();
    let mime = mime_type_from_extension(&path);

    // Enforce supported format allowlist (dialog filters are not a hard boundary)
    const ALLOWED_EXTENSIONS: &[&str] = &["png", "jpg", "jpeg", "gif", "webp", "pdf", "txt"];
    let ext_lower = path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase());
    if !ext_lower
        .as_deref()
        .is_some_and(|e| ALLOWED_EXTENSIONS.contains(&e))
    {
        return Err(format!(
            "Unsupported file format. Allowed: {}",
            ALLOWED_EXTENSIONS.join(", ")
        ));
    }

    let data = std::fs::read(&path).map_err(|e| e.to_string())?;

    let asset = storage::assets::save_asset(
        &state.storage,
        nid,
        &filename,
        mime,
        SourceType::Uploaded,
        &data,
    )
    .map_err(|e| e.to_string())?;

    let stored_name = asset_stored_name(asset.id, &filename);
    insert_asset_reference_and_save(&state, nid, &stored_name, &filename, mime)?;

    reload_data(&state)
}

#[tauri::command]
fn paste_asset(
    note_id: String,
    data: Vec<u8>,
    mime_type: String,
    state: State<'_, AppState>,
) -> Result<ViewModel, String> {
    let nid = Uuid::parse_str(&note_id).map_err(|e| e.to_string())?;

    if data.is_empty() {
        return Err("No data to paste".into());
    }
    if data.len() as u64 > MAX_UPLOAD_SIZE {
        return Err("Pasted data too large".into());
    }

    // Validate MIME type against allowed image types
    const ALLOWED_PASTE_MIMES: &[&str] = &["image/png", "image/jpeg", "image/gif", "image/webp"];
    if !ALLOWED_PASTE_MIMES.contains(&mime_type.as_str()) {
        return Err(format!(
            "Unsupported paste format '{}'. Allowed: {}",
            mime_type,
            ALLOWED_PASTE_MIMES.join(", ")
        ));
    }

    let ext = extension_from_mime(&mime_type);
    let timestamp = chrono::Utc::now().format("%Y%m%d-%H%M%S");
    let filename = format!("paste-{timestamp}.{ext}");

    let asset = storage::assets::save_asset(
        &state.storage,
        nid,
        &filename,
        &mime_type,
        SourceType::Pasted,
        &data,
    )
    .map_err(|e| e.to_string())?;

    let stored_name = asset_stored_name(asset.id, &filename);
    insert_asset_reference_and_save(&state, nid, &stored_name, "pasted image", &mime_type)?;

    reload_data(&state)
}

#[tauri::command]
fn capture_screen(
    note_id: String,
    window: tauri::Window,
    state: State<'_, AppState>,
) -> Result<ViewModel, String> {
    let nid = Uuid::parse_str(&note_id).map_err(|e| e.to_string())?;

    // Verify note exists
    storage::notes::read_note(&state.storage, &nid).map_err(|e| e.to_string())?;

    let temp_path = std::env::temp_dir().join(format!("mlmm-capture-{}.png", Uuid::new_v4()));
    let temp_str = temp_path
        .to_str()
        .ok_or_else(|| "Invalid temp path".to_string())?
        .to_string();

    // Minimise window before capture
    let _ = window.minimize();
    // Small delay to let the window minimise
    std::thread::sleep(std::time::Duration::from_millis(400));

    let output = std::process::Command::new("gnome-screenshot")
        .args(["-a", "-f", &temp_str])
        .output()
        .map_err(|e| format!("Failed to launch gnome-screenshot: {e}"))?;

    // Restore window
    let _ = window.unminimize();
    let _ = window.set_focus();

    if !output.status.success() || !temp_path.exists() {
        // User cancelled the capture or tool failed — not an error
        let _ = std::fs::remove_file(&temp_path);
        return reload_data(&state);
    }

    let data = std::fs::read(&temp_path).map_err(|e| e.to_string())?;
    let _ = std::fs::remove_file(&temp_path);

    if data.is_empty() {
        return reload_data(&state);
    }

    let timestamp = chrono::Utc::now().format("%Y%m%d-%H%M%S");
    let filename = format!("capture-{timestamp}.png");

    let asset = storage::assets::save_asset(
        &state.storage,
        nid,
        &filename,
        "image/png",
        SourceType::Captured,
        &data,
    )
    .map_err(|e| e.to_string())?;

    let stored_name = asset_stored_name(asset.id, &filename);
    insert_asset_reference_and_save(&state, nid, &stored_name, "screen capture", "image/png")?;

    reload_data(&state)
}

#[tauri::command]
fn read_asset_base64(
    note_id: String,
    asset_id: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    use base64::Engine;

    let nid = Uuid::parse_str(&note_id).map_err(|e| e.to_string())?;
    let aid = Uuid::parse_str(&asset_id).map_err(|e| e.to_string())?;

    let assets = storage::assets::list_assets(&state.storage, nid).map_err(|e| e.to_string())?;
    let asset = assets
        .iter()
        .find(|a| a.id == aid)
        .ok_or_else(|| format!("Asset {aid} not found"))?;

    let data = storage::assets::read_asset(&state.storage, nid, aid).map_err(|e| e.to_string())?;
    let b64 = base64::engine::general_purpose::STANDARD.encode(&data);

    Ok(format!("data:{};base64,{}", asset.mime_type, b64))
}

#[tauri::command]
fn list_note_assets(
    note_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<shared::model::Asset>, String> {
    let nid = Uuid::parse_str(&note_id).map_err(|e| e.to_string())?;
    storage::assets::list_assets(&state.storage, nid).map_err(|e| e.to_string())
}

#[derive(Serialize, Clone)]
struct BacklinkItem {
    source_note_id: String,
    source_note_title: String,
    context_text: String,
    is_broken: bool,
}

/// Extract ~200 chars of context around a `[[note_id|...]]` reference in a note's content.
fn extract_reference_context(content: &str, target_note_id: &str) -> String {
    let pattern = format!("[[{target_note_id}|");
    if let Some(start) = content.find(&pattern) {
        let ctx_start = start.saturating_sub(80);
        let ctx_end = (start + 120).min(content.len());
        let mut context = content[ctx_start..ctx_end].to_string();
        if ctx_start > 0 {
            context = format!("...{context}");
        }
        if ctx_end < content.len() {
            context.push_str("...");
        }
        context
    } else {
        // Fallback: first 200 chars
        let end = content.len().min(200);
        let mut context = content[..end].to_string();
        if end < content.len() {
            context.push_str("...");
        }
        context
    }
}

#[tauri::command]
fn get_note_backlinks(
    note_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<BacklinkItem>, String> {
    let nid = Uuid::parse_str(&note_id).map_err(|e| e.to_string())?;
    let backlinks =
        storage::relations::get_backlinks(&state.storage, nid).map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for backlink in backlinks {
        let source_id = backlink.source_note_id;
        match storage::notes::read_note(&state.storage, &source_id) {
            Ok(source_note) => {
                let context = extract_reference_context(&source_note.content_raw, &nid.to_string());
                items.push(BacklinkItem {
                    source_note_id: source_id.to_string(),
                    source_note_title: source_note.title,
                    context_text: context,
                    is_broken: backlink.broken,
                });
            }
            Err(_) => {
                // Source note was deleted — this backlink is orphaned
                items.push(BacklinkItem {
                    source_note_id: source_id.to_string(),
                    source_note_title: "(deleted note)".to_string(),
                    context_text: String::new(),
                    is_broken: true,
                });
            }
        }
    }
    Ok(items)
}

#[tauri::command]
fn get_broken_references(
    note_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<String>, String> {
    let nid = Uuid::parse_str(&note_id).map_err(|e| e.to_string())?;
    let forward =
        storage::relations::get_forward_links(&state.storage, nid).map_err(|e| e.to_string())?;
    let broken_ids: Vec<String> = forward
        .into_iter()
        .filter(|r| r.broken)
        .map(|r| r.target_note_id.to_string())
        .collect();
    Ok(broken_ids)
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
        .plugin(tauri_plugin_dialog::init())
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
            upload_asset,
            paste_asset,
            capture_screen,
            read_asset_base64,
            list_note_assets,
            get_note_backlinks,
            get_broken_references,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
