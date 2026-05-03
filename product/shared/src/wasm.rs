use wasm_bindgen::prelude::*;

use crate::app::{update, view};
use crate::event::Event;
use crate::model::Model;

// Improved panic messages in browser console.
#[wasm_bindgen(start)]
pub fn setup() {
    console_error_panic_hook::set_once();
}

/// Opaque handle to the application model held on the JS side.
#[wasm_bindgen]
pub struct AppHandle {
    model: Model,
}

#[wasm_bindgen]
impl AppHandle {
    /// Create a new handle with a default (empty) model.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            model: Model::default(),
        }
    }

    /// Dispatch an event JSON string, returning a JSON-encoded array of Effects.
    ///
    /// JS: `const effects = JSON.parse(handle.dispatch(JSON.stringify(event)));`
    #[wasm_bindgen]
    pub fn dispatch(&mut self, event_json: &str) -> Result<String, JsValue> {
        let event: Event =
            serde_json::from_str(event_json).map_err(|e| JsValue::from_str(&e.to_string()))?;
        let effects = update(event, &mut self.model);
        serde_json::to_string(&effects).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Return the current ViewModel as a JSON string.
    ///
    /// JS: `const vm = JSON.parse(handle.view());`
    #[wasm_bindgen]
    pub fn view(&self) -> Result<String, JsValue> {
        let vm = view(&self.model);
        serde_json::to_string(&vm).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}
