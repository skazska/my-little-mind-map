use axum::{
    Json,
    body::Bytes,
    extract::{Path, State},
    http::{StatusCode, header},
    response::IntoResponse,
};
use shared::model::SourceType;
use uuid::Uuid;

use crate::AppState;

pub async fn upload_asset(
    State(state): State<AppState>,
    Path(note_id): Path<Uuid>,
    body: Bytes,
) -> impl IntoResponse {
    // For POC: derive filename and mime_type from a simple default.
    // A production version would use multipart form data.
    let filename = format!("upload_{}.bin", uuid::Uuid::new_v4());
    let mime_type = "application/octet-stream";

    match storage::assets::save_asset(
        &state.storage,
        note_id,
        &filename,
        mime_type,
        SourceType::Uploaded,
        &body,
    ) {
        Ok(asset) => (
            StatusCode::CREATED,
            Json(serde_json::to_value(&asset).unwrap()),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}

pub async fn get_asset(
    State(state): State<AppState>,
    Path((note_id, asset_id)): Path<(Uuid, Uuid)>,
) -> impl IntoResponse {
    // Look up asset metadata for the Content-Type header
    let mime_type = storage::assets::list_assets(&state.storage, note_id)
        .ok()
        .and_then(|assets| {
            assets
                .into_iter()
                .find(|a| a.id == asset_id)
                .map(|a| a.mime_type)
        })
        .unwrap_or_else(|| "application/octet-stream".to_string());

    match storage::assets::read_asset(&state.storage, note_id, asset_id) {
        Ok(data) => (StatusCode::OK, [(header::CONTENT_TYPE, mime_type)], data).into_response(),
        Err(storage::StorageError::NotFound(_)) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Asset not found"})),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}

pub async fn delete_asset(
    State(state): State<AppState>,
    Path((note_id, asset_id)): Path<(Uuid, Uuid)>,
) -> impl IntoResponse {
    match storage::assets::delete_asset(&state.storage, note_id, asset_id) {
        Ok(()) => StatusCode::NO_CONTENT.into_response(),
        Err(storage::StorageError::NotFound(_)) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Asset not found"})),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}
