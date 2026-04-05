use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::AppState;

#[derive(Deserialize)]
pub struct ClassificationRequest {
    pub note_id: Uuid,
    pub topic_id: Uuid,
}

pub async fn classify_note(
    State(state): State<AppState>,
    Json(body): Json<ClassificationRequest>,
) -> impl IntoResponse {
    match storage::relations::classify_note(&state.storage, body.note_id, body.topic_id) {
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

pub async fn unclassify_note(
    State(state): State<AppState>,
    Json(body): Json<ClassificationRequest>,
) -> impl IntoResponse {
    match storage::relations::unclassify_note(&state.storage, body.note_id, body.topic_id) {
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

pub async fn get_note_topics(
    State(state): State<AppState>,
    Path(note_id): Path<Uuid>,
) -> impl IntoResponse {
    match storage::relations::get_note_topics(&state.storage, note_id) {
        Ok(topics) => {
            (StatusCode::OK, Json(serde_json::to_value(&topics).unwrap())).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}

pub async fn get_topic_notes(
    State(state): State<AppState>,
    Path(topic_id): Path<Uuid>,
) -> impl IntoResponse {
    match storage::relations::get_topic_notes(&state.storage, topic_id) {
        Ok(notes) => {
            (StatusCode::OK, Json(serde_json::to_value(&notes).unwrap())).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}
