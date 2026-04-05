pub mod handlers;

use axum::{Json, Router, routing::{delete, get, post, put}};
use serde::Serialize;
use storage::StorageHandle;

#[derive(Clone)]
pub struct AppState {
    pub storage: StorageHandle,
}

#[derive(Serialize)]
struct Health {
    status: String,
}

async fn health() -> Json<Health> {
    Json(Health {
        status: "ok".to_string(),
    })
}

fn api_router() -> Router<AppState> {
    Router::new()
        // Notes
        .route("/api/notes", post(handlers::notes::create_note))
        .route("/api/notes", get(handlers::notes::list_notes))
        .route("/api/notes/{id}", get(handlers::notes::get_note))
        .route("/api/notes/{id}", put(handlers::notes::update_note))
        .route("/api/notes/{id}", delete(handlers::notes::delete_note))
        // Topics
        .route("/api/topics", post(handlers::topics::create_topic))
        .route("/api/topics", get(handlers::topics::list_topics))
        .route("/api/topics/{id}", get(handlers::topics::get_topic))
        .route("/api/topics/{id}", put(handlers::topics::update_topic))
        .route("/api/topics/{id}", delete(handlers::topics::delete_topic))
        // Classifications
        .route(
            "/api/classifications",
            post(handlers::classifications::classify_note),
        )
        .route(
            "/api/classifications",
            delete(handlers::classifications::unclassify_note),
        )
        .route(
            "/api/notes/{id}/topics",
            get(handlers::classifications::get_note_topics),
        )
        .route(
            "/api/topics/{id}/notes",
            get(handlers::classifications::get_topic_notes),
        )
        // References
        .route(
            "/api/references",
            post(handlers::references::add_reference),
        )
        .route(
            "/api/references",
            delete(handlers::references::remove_reference),
        )
        .route(
            "/api/notes/{id}/backlinks",
            get(handlers::references::get_backlinks),
        )
        // Topic Relations
        .route(
            "/api/topic-relations",
            post(handlers::topic_relations::add_topic_relation),
        )
        .route(
            "/api/topic-relations",
            delete(handlers::topic_relations::remove_topic_relation),
        )
        .route(
            "/api/topics/{id}/relations",
            get(handlers::topic_relations::get_topic_relations),
        )
        // Assets
        .route(
            "/api/notes/{id}/assets",
            post(handlers::assets::upload_asset),
        )
        .route(
            "/api/notes/{note_id}/assets/{asset_id}",
            get(handlers::assets::get_asset),
        )
        .route(
            "/api/notes/{note_id}/assets/{asset_id}",
            delete(handlers::assets::delete_asset),
        )
}

pub fn create_app(storage: StorageHandle) -> Router {
    let state = AppState { storage };
    Router::new()
        .route("/health", get(health))
        .merge(api_router())
        .with_state(state)
}
