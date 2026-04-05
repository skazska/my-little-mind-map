use crux_core::Core;
use shared::{Event, MindMap, ViewModel};
use tauri::State;

struct AppState {
    core: Core<MindMap>,
}

impl Default for AppState {
    fn default() -> Self {
        Self { core: Core::new() }
    }
}

#[tauri::command]
fn get_view(state: State<'_, AppState>) -> ViewModel {
    state.core.view()
}

#[tauri::command]
fn process_event(event: Event, state: State<'_, AppState>) -> ViewModel {
    let _effects = state.core.process_event(event);
    // TODO: handle effects (render, HTTP, etc.)
    state.core.view()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![get_view, process_event])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
