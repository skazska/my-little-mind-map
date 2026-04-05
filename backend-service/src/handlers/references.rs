use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::Deserialize;
use shared::model::{NoteReference, ReferenceType};
use uuid::Uuid;

use crate::AppState;

#[derive(Deserialize)]
pub struct ReferenceRequest {
    pub source_note_id: Uuid,
    pub target_note_id: Uuid,
    #[serde(default = "default_ref_type")]
    pub reference_type: ReferenceType,
}

fn default_ref_type() -> ReferenceType {
    ReferenceType::LinksTo
}

pub async fn add_reference(
    State(state): State<AppState>,
    Json(body): Json<ReferenceRequest>,
) -> impl IntoResponse {
    let reference = NoteReference::new(
        body.source_note_id,
        body.target_note_id,
        body.reference_type,
    );
    match storage::relations::add_reference(&state.storage, &reference) {
        Ok(()) => StatusCode::CREATED.into_response(),
        Err(storage::StorageError::AlreadyExists(msg)) => (
            StatusCode::CONFLICT,
            Json(serde_json::json!({"error": msg})),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}

#[derive(Deserialize)]
pub struct RemoveReferenceRequest {
    pub source_note_id: Uuid,
    pub target_note_id: Uuid,
}

pub async fn remove_reference(
    State(state): State<AppState>,
    Json(body): Json<RemoveReferenceRequest>,
) -> impl IntoResponse {
    match storage::relations::remove_reference(
        &state.storage,
        body.source_note_id,
        body.target_note_id,
    ) {
        Ok(()) => StatusCode::NO_CONTENT.into_response(),
        Err(storage::StorageError::NotFound(msg)) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": msg})),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}

pub async fn get_backlinks(
    State(state): State<AppState>,
    Path(note_id): Path<Uuid>,
) -> impl IntoResponse {
    match storage::relations::get_backlinks(&state.storage, note_id) {
        Ok(refs) => (StatusCode::OK, Json(serde_json::to_value(&refs).unwrap())).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}
