use crux_core::Core;
use shared::{Event, MindMap, ViewModel};
use storage::StorageHandle;
use tauri::{Manager, State};

struct AppState {
    core: Core<MindMap>,
    #[expect(dead_code)] // Used in Phase 2 when CRUX effects trigger storage operations
    storage: StorageHandle,
}

#[tauri::command]
fn get_view(state: State<'_, AppState>) -> ViewModel {
    state.core.view()
}

#[tauri::command]
fn process_event(event: Event, state: State<'_, AppState>) -> ViewModel {
    let _effects = state.core.process_event(event);
    // TODO: handle effects (render, HTTP, storage, etc.)
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
        .invoke_handler(tauri::generate_handler![get_view, process_event])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
