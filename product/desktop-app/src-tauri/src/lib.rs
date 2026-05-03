use std::sync::Mutex;

use shared::app;
use shared::effect::{Effect, StorageRequest};
use shared::event::Event;
use shared::model::Model;
use storage::FsStorage;
use tauri::{Manager, State};

// ── App state ─────────────────────────────────────────────────────────────────

pub struct AppState {
    pub model: Mutex<Model>,
}

// ── dispatch ──────────────────────────────────────────────────────────────────

/// Single entry-point: send an event JSON, get back a ViewModel JSON.
///
/// The std::sync::Mutex lock is acquired, released, then async I/O runs,
/// then re-acquired to feed response events back.
#[tauri::command]
async fn dispatch(state: State<'_, AppState>, event_json: String) -> Result<String, String> {
    let event: Event =
        serde_json::from_str(&event_json).map_err(|e| format!("invalid event JSON: {e}"))?;

    // Step 1: update model, collect effects (lock held briefly).
    let (effects, data_folder) = {
        let mut model = state.model.lock().map_err(|e| e.to_string())?;
        let effects = app::update(event, &mut model);
        let folder = model.data_folder.clone();
        (effects, folder)
    };

    // Step 2: execute effects (no lock held).
    let responses = execute_effects(effects, data_folder.as_deref()).await;

    // Step 3: feed responses back.
    for resp in responses {
        let (more_effects, folder2) = {
            let mut model = state.model.lock().map_err(|e| e.to_string())?;
            let more = app::update(resp, &mut model);
            let f2 = model.data_folder.clone();
            (more, f2)
        };
        let resps2 = execute_effects(more_effects, folder2.as_deref()).await;
        for r2 in resps2 {
            let mut model = state.model.lock().map_err(|e| e.to_string())?;
            app::update(r2, &mut model);
        }
    }

    // Step 4: build view (lock held briefly).
    let vm_json = {
        let model = state.model.lock().map_err(|e| e.to_string())?;
        let vm = app::view(&model);
        serde_json::to_string(&vm).map_err(|e| e.to_string())?
    };

    Ok(vm_json)
}

/// Execute effects and return response Events (no model lock held).
async fn execute_effects(effects: Vec<Effect>, data_folder: Option<&str>) -> Vec<Event> {
    let mut responses = Vec::new();
    let folder = match data_folder {
        Some(f) => f.to_owned(),
        None => return responses,
    };

    for effect in effects {
        match effect {
            Effect::Render => {}
            Effect::Http(_) => {}
            Effect::Storage(req) => {
                let storage = match FsStorage::new(&folder).await {
                    Ok(s) => s,
                    Err(e) => {
                        responses.push(Event::EffectError {
                            message: e.to_string(),
                        });
                        continue;
                    }
                };
                let event = execute_storage(req, &storage).await;
                responses.push(event);
            }
        }
    }
    responses
}

/// Map a StorageRequest to a response Event.
async fn execute_storage(req: StorageRequest, storage: &FsStorage) -> Event {
    use storage::Storage;

    match req {
        StorageRequest::LoadSettings => match storage.get_settings().await {
            Ok(s) => Event::SettingsLoaded { settings: s },
            Err(e) => Event::EffectError {
                message: e.to_string(),
            },
        },
        StorageRequest::SaveSettings { settings } => {
            match storage.update_settings(&settings).await {
                Ok(()) => Event::SettingsLoaded { settings },
                Err(e) => Event::EffectError {
                    message: e.to_string(),
                },
            }
        }
        StorageRequest::LoadSpaces => match storage.list_spaces().await {
            Ok(spaces) => Event::SpacesLoaded { spaces },
            Err(e) => Event::EffectError {
                message: e.to_string(),
            },
        },
        StorageRequest::CreateSpace { space } => match storage.create_space(&space).await {
            Ok(()) => Event::SpaceCreated { space },
            Err(e) => Event::EffectError {
                message: e.to_string(),
            },
        },
        StorageRequest::DeleteSpace { id } => match storage.delete_space(&id).await {
            Ok(()) => Event::SpaceDeleted { id },
            Err(e) => Event::EffectError {
                message: e.to_string(),
            },
        },
        StorageRequest::LoadNotes { space_id } => match storage.list_notes(&space_id).await {
            Ok(note_ids) => Event::NoteListLoaded { space_id, note_ids },
            Err(e) => Event::EffectError {
                message: e.to_string(),
            },
        },
        StorageRequest::LoadNote { id } => match storage.get_note(&id).await {
            Ok(Some(note)) => Event::NoteLoaded { note },
            Ok(None) => Event::EffectError {
                message: format!("note not found: {id}"),
            },
            Err(e) => Event::EffectError {
                message: e.to_string(),
            },
        },
        StorageRequest::SaveNote { note } => {
            let id = note.id.clone();
            let result = match storage.get_note(&id).await {
                Ok(None) => storage.create_note(&note).await,
                _ => storage.update_note(&note).await,
            };
            match result {
                Ok(()) => Event::NoteSaved { id },
                Err(e) => Event::EffectError {
                    message: e.to_string(),
                },
            }
        }
        StorageRequest::DeleteNote { id } => match storage.delete_note(&id).await {
            Ok(()) => Event::NoteDeleted { id },
            Err(e) => Event::EffectError {
                message: e.to_string(),
            },
        },
    }
}

// ── get_view ──────────────────────────────────────────────────────────────────

#[tauri::command]
fn get_view(state: State<'_, AppState>) -> Result<String, String> {
    let model = state.model.lock().map_err(|e| e.to_string())?;
    let vm = app::view(&model);
    serde_json::to_string(&vm).map_err(|e| e.to_string())
}

// ── open_folder_dialog ────────────────────────────────────────────────────────

#[tauri::command]
async fn open_folder_dialog(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.dialog().file().pick_folder(move |folder| {
        let _ = tx.send(folder);
    });
    let folder = rx.await.map_err(|e| e.to_string())?;
    Ok(folder.map(|f| f.to_string()))
}

// ── get_settings_path ─────────────────────────────────────────────────────────

#[tauri::command]
fn get_settings_path(app: tauri::AppHandle) -> Result<String, String> {
    let config_dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    Ok(config_dir
        .join("settings.json")
        .to_string_lossy()
        .into_owned())
}

// ── entry ─────────────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            model: Mutex::new(Model::default()),
        })
        .invoke_handler(tauri::generate_handler![
            dispatch,
            get_view,
            open_folder_dialog,
            get_settings_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
