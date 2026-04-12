use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use chrono::Utc;
use serde::Deserialize;
use shared::model::{Note, SourceType};
use uuid::Uuid;

use crate::AppState;

#[derive(Deserialize)]
pub struct CreateNoteRequest {
    pub title: String,
    pub content: String,
    #[serde(default)]
    pub topic_ids: Vec<Uuid>,
}

#[derive(Deserialize)]
pub struct UpdateNoteRequest {
    pub title: String,
    pub content: String,
}

pub async fn create_note(
    State(state): State<AppState>,
    Json(body): Json<CreateNoteRequest>,
) -> impl IntoResponse {
    if body.topic_ids.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": "At least one topic_id is required (D-011)"})),
        )
            .into_response();
    }

    // Verify all topics exist
    for tid in &body.topic_ids {
        match storage::topics::read_topic(&state.storage, tid) {
            Ok(_) => {}
            Err(storage::StorageError::NotFound(_)) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(serde_json::json!({"error": format!("Topic {tid} not found")})),
                )
                    .into_response();
            }
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({"error": e.to_string()})),
                )
                    .into_response();
            }
        }
    }

    let note = Note::new(body.title, body.content, SourceType::Typed);
    let note_id = note.id;

    if let Err(e) = storage::notes::create_note(&state.storage, &note) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response();
    }

    // Create classifications. Roll back the note if any classification fails.
    for tid in &body.topic_ids {
        if let Err(e) = storage::relations::classify_note(&state.storage, note_id, *tid) {
            let _ = storage::notes::delete_note(&state.storage, &note_id);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": e.to_string()})),
            )
                .into_response();
        }
    }

    (
        StatusCode::CREATED,
        Json(serde_json::to_value(&note).unwrap()),
    )
        .into_response()
}

pub async fn list_notes(State(state): State<AppState>) -> impl IntoResponse {
    match storage::notes::list_notes(&state.storage) {
        Ok(notes) => (StatusCode::OK, Json(serde_json::to_value(&notes).unwrap())).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}

pub async fn get_note(State(state): State<AppState>, Path(id): Path<Uuid>) -> impl IntoResponse {
    match storage::notes::read_note(&state.storage, &id) {
        Ok(note) => (StatusCode::OK, Json(serde_json::to_value(&note).unwrap())).into_response(),
        Err(storage::StorageError::NotFound(_)) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Note not found"})),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}

pub async fn update_note(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<UpdateNoteRequest>,
) -> impl IntoResponse {
    match storage::notes::read_note(&state.storage, &id) {
        Ok(mut note) => {
            note.title = body.title;
            note.content_raw = body.content;
            note.updated_at = Utc::now();
            note.version += 1;
            match storage::notes::update_note(&state.storage, &note) {
                Ok(()) => {
                    (StatusCode::OK, Json(serde_json::to_value(&note).unwrap())).into_response()
                }
                Err(e) => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({"error": e.to_string()})),
                )
                    .into_response(),
            }
        }
        Err(storage::StorageError::NotFound(_)) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Note not found"})),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}

pub async fn delete_note(State(state): State<AppState>, Path(id): Path<Uuid>) -> impl IntoResponse {
    // Clean up classifications and references before deleting the note
    if let Err(e) = storage::relations::remove_note_classifications(&state.storage, id)
        && !matches!(e, storage::StorageError::NotFound(_))
    {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response();
    }
    if let Err(e) = storage::relations::remove_note_references(&state.storage, id)
        && !matches!(e, storage::StorageError::NotFound(_))
    {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response();
    }

    match storage::notes::delete_note(&state.storage, &id) {
        Ok(()) => StatusCode::NO_CONTENT.into_response(),
        Err(storage::StorageError::NotFound(_)) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Note not found"})),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}
