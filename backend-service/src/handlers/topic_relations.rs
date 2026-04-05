use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::Deserialize;
use shared::model::{TopicRelation, TopicRelationType};
use uuid::Uuid;

use crate::AppState;

#[derive(Deserialize)]
pub struct TopicRelationRequest {
    pub source_topic_id: Uuid,
    pub target_topic_id: Uuid,
    pub relation_type: TopicRelationType,
}

pub async fn add_topic_relation(
    State(state): State<AppState>,
    Json(body): Json<TopicRelationRequest>,
) -> impl IntoResponse {
    let rel = TopicRelation::new(body.source_topic_id, body.target_topic_id, body.relation_type);
    match storage::relations::add_topic_relation(&state.storage, &rel) {
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
pub struct RemoveTopicRelationRequest {
    pub source_topic_id: Uuid,
    pub target_topic_id: Uuid,
}

pub async fn remove_topic_relation(
    State(state): State<AppState>,
    Json(body): Json<RemoveTopicRelationRequest>,
) -> impl IntoResponse {
    match storage::relations::remove_topic_relation(
        &state.storage,
        body.source_topic_id,
        body.target_topic_id,
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

pub async fn get_topic_relations(
    State(state): State<AppState>,
    Path(topic_id): Path<Uuid>,
) -> impl IntoResponse {
    match storage::relations::get_topic_relations(&state.storage, topic_id) {
        Ok(rels) => {
            (StatusCode::OK, Json(serde_json::to_value(&rels).unwrap())).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}
