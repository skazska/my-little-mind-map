use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::Deserialize;
use shared::model::Topic;
use uuid::Uuid;

use crate::AppState;

#[derive(Deserialize)]
pub struct CreateTopicRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateTopicRequest {
    pub name: String,
    pub description: Option<String>,
}

pub async fn create_topic(
    State(state): State<AppState>,
    Json(body): Json<CreateTopicRequest>,
) -> impl IntoResponse {
    let topic = Topic::new(body.name, body.description);
    match storage::topics::create_topic(&state.storage, &topic) {
        Ok(()) => (
            StatusCode::CREATED,
            Json(serde_json::to_value(&topic).unwrap()),
        )
            .into_response(),
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

pub async fn list_topics(State(state): State<AppState>) -> impl IntoResponse {
    match storage::topics::list_topics(&state.storage) {
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

pub async fn get_topic(State(state): State<AppState>, Path(id): Path<Uuid>) -> impl IntoResponse {
    match storage::topics::read_topic(&state.storage, &id) {
        Ok(topic) => (StatusCode::OK, Json(serde_json::to_value(&topic).unwrap())).into_response(),
        Err(storage::StorageError::NotFound(_)) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Topic not found"})),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}

pub async fn update_topic(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<UpdateTopicRequest>,
) -> impl IntoResponse {
    match storage::topics::read_topic(&state.storage, &id) {
        Ok(mut topic) => {
            topic.name = body.name;
            topic.description = body.description;
            topic.updated_at = chrono::Utc::now();
            topic.version += 1;
            match storage::topics::update_topic(&state.storage, &topic) {
                Ok(()) => {
                    (StatusCode::OK, Json(serde_json::to_value(&topic).unwrap())).into_response()
                }
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
        Err(storage::StorageError::NotFound(_)) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Topic not found"})),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}

pub async fn delete_topic(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    // Clean up classifications and relations
    let _ = storage::relations::remove_topic_classifications(&state.storage, id);
    let _ = storage::relations::remove_topic_all_relations(&state.storage, id);

    match storage::topics::delete_topic(&state.storage, &id) {
        Ok(()) => StatusCode::NO_CONTENT.into_response(),
        Err(storage::StorageError::NotFound(_)) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Topic not found"})),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}
