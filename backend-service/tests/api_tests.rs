#[cfg(test)]
mod api_tests {
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use serde_json::json;
    use tempfile::tempdir;
    use tower::ServiceExt;

    fn setup_app() -> (axum::Router, tempfile::TempDir) {
        let dir = tempdir().unwrap();
        let storage = storage::init_storage(dir.path()).unwrap();
        let app = backend_service::create_app(storage);
        (app, dir)
    }

    fn json_request(method: &str, uri: &str, body: Option<serde_json::Value>) -> Request<Body> {
        let builder = Request::builder()
            .method(method)
            .uri(uri)
            .header("content-type", "application/json");

        match body {
            Some(b) => builder.body(Body::from(b.to_string())).unwrap(),
            None => builder.body(Body::empty()).unwrap(),
        }
    }

    async fn response_json(resp: axum::response::Response) -> serde_json::Value {
        let bytes = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        serde_json::from_slice(&bytes).unwrap()
    }

    #[tokio::test]
    async fn health_endpoint_works() {
        let (app, _dir) = setup_app();
        let resp = app
            .oneshot(
                Request::builder()
                    .uri("/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = response_json(resp).await;
        assert_eq!(body["status"], "ok");
    }

    #[tokio::test]
    async fn topic_crud() {
        let (app, _dir) = setup_app();

        // Create topic
        let resp = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/topics",
                Some(json!({"name": "Rust", "description": "Programming language"})),
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::CREATED);
        let topic = response_json(resp).await;
        let topic_id = topic["id"].as_str().unwrap();

        // Get topic
        let resp = app
            .clone()
            .oneshot(json_request(
                "GET",
                &format!("/api/topics/{topic_id}"),
                None,
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = response_json(resp).await;
        assert_eq!(body["name"], "Rust");

        // List topics
        let resp = app
            .clone()
            .oneshot(json_request("GET", "/api/topics", None))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = response_json(resp).await;
        assert_eq!(body.as_array().unwrap().len(), 1);

        // Update topic
        let resp = app
            .clone()
            .oneshot(json_request(
                "PUT",
                &format!("/api/topics/{topic_id}"),
                Some(json!({"name": "Rust Lang", "description": "Systems language"})),
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = response_json(resp).await;
        assert_eq!(body["name"], "Rust Lang");

        // Delete topic
        let resp = app
            .clone()
            .oneshot(json_request(
                "DELETE",
                &format!("/api/topics/{topic_id}"),
                None,
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::NO_CONTENT);

        // Verify deleted
        let resp = app
            .oneshot(json_request(
                "GET",
                &format!("/api/topics/{topic_id}"),
                None,
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn note_crud_with_classification() {
        let (app, _dir) = setup_app();

        // Create topic first (required for note classification)
        let resp = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/topics",
                Some(json!({"name": "Test Topic"})),
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::CREATED);
        let topic = response_json(resp).await;
        let topic_id = topic["id"].as_str().unwrap();

        // Create note without topic should fail
        let resp = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/notes",
                Some(json!({"title": "No Topic", "content": "test", "topic_ids": []})),
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);

        // Create note with topic
        let resp = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/notes",
                Some(
                    json!({"title": "My Note", "content": "# Hello\nWorld", "topic_ids": [topic_id]}),
                ),
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::CREATED);
        let note = response_json(resp).await;
        let note_id = note["id"].as_str().unwrap();

        // Get note
        let resp = app
            .clone()
            .oneshot(json_request("GET", &format!("/api/notes/{note_id}"), None))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = response_json(resp).await;
        assert_eq!(body["title"], "My Note");
        assert_eq!(body["content_raw"], "# Hello\nWorld");

        // List notes
        let resp = app
            .clone()
            .oneshot(json_request("GET", "/api/notes", None))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = response_json(resp).await;
        assert_eq!(body.as_array().unwrap().len(), 1);

        // Get note topics
        let resp = app
            .clone()
            .oneshot(json_request(
                "GET",
                &format!("/api/notes/{note_id}/topics"),
                None,
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let topics = response_json(resp).await;
        assert_eq!(topics.as_array().unwrap().len(), 1);

        // Get topic notes
        let resp = app
            .clone()
            .oneshot(json_request(
                "GET",
                &format!("/api/topics/{topic_id}/notes"),
                None,
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let notes = response_json(resp).await;
        assert_eq!(notes.as_array().unwrap().len(), 1);

        // Update note
        let resp = app
            .clone()
            .oneshot(json_request(
                "PUT",
                &format!("/api/notes/{note_id}"),
                Some(json!({"title": "Updated", "content": "# Updated"})),
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = response_json(resp).await;
        assert_eq!(body["title"], "Updated");

        // Delete note
        let resp = app
            .clone()
            .oneshot(json_request(
                "DELETE",
                &format!("/api/notes/{note_id}"),
                None,
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::NO_CONTENT);
    }

    #[tokio::test]
    async fn note_references() {
        let (app, _dir) = setup_app();

        // Create a topic and two notes
        let resp = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/topics",
                Some(json!({"name": "T"})),
            ))
            .await
            .unwrap();
        let topic = response_json(resp).await;
        let tid = topic["id"].as_str().unwrap();

        let resp = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/notes",
                Some(json!({"title": "A", "content": "a", "topic_ids": [tid]})),
            ))
            .await
            .unwrap();
        let note_a = response_json(resp).await;
        let aid = note_a["id"].as_str().unwrap();

        let resp = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/notes",
                Some(json!({"title": "B", "content": "b", "topic_ids": [tid]})),
            ))
            .await
            .unwrap();
        let note_b = response_json(resp).await;
        let bid = note_b["id"].as_str().unwrap();

        // Add reference A → B
        let resp = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/references",
                Some(json!({"source_note_id": aid, "target_note_id": bid})),
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::CREATED);

        // Get backlinks for B
        let resp = app
            .clone()
            .oneshot(json_request(
                "GET",
                &format!("/api/notes/{bid}/backlinks"),
                None,
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let backlinks = response_json(resp).await;
        assert_eq!(backlinks.as_array().unwrap().len(), 1);

        // Remove reference
        let resp = app
            .clone()
            .oneshot(json_request(
                "DELETE",
                "/api/references",
                Some(json!({"source_note_id": aid, "target_note_id": bid})),
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::NO_CONTENT);
    }

    #[tokio::test]
    async fn topic_relations() {
        let (app, _dir) = setup_app();

        // Create two topics
        let resp = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/topics",
                Some(json!({"name": "Parent"})),
            ))
            .await
            .unwrap();
        let parent = response_json(resp).await;
        let pid = parent["id"].as_str().unwrap();

        let resp = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/topics",
                Some(json!({"name": "Child"})),
            ))
            .await
            .unwrap();
        let child = response_json(resp).await;
        let cid = child["id"].as_str().unwrap();

        // Add relation
        let resp = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/topic-relations",
                Some(json!({
                    "source_topic_id": cid,
                    "target_topic_id": pid,
                    "relation_type": "subtopic-of"
                })),
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::CREATED);

        // Get relations
        let resp = app
            .clone()
            .oneshot(json_request(
                "GET",
                &format!("/api/topics/{cid}/relations"),
                None,
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let rels = response_json(resp).await;
        assert_eq!(rels.as_array().unwrap().len(), 1);

        // Remove relation
        let resp = app
            .clone()
            .oneshot(json_request(
                "DELETE",
                "/api/topic-relations",
                Some(json!({
                    "source_topic_id": cid,
                    "target_topic_id": pid
                })),
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::NO_CONTENT);
    }

    #[tokio::test]
    async fn nonexistent_note_returns_404() {
        let (app, _dir) = setup_app();
        let fake_id = uuid::Uuid::new_v4();
        let resp = app
            .oneshot(json_request("GET", &format!("/api/notes/{fake_id}"), None))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn nonexistent_topic_returns_404() {
        let (app, _dir) = setup_app();
        let fake_id = uuid::Uuid::new_v4();
        let resp = app
            .oneshot(json_request("GET", &format!("/api/topics/{fake_id}"), None))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn forward_links_endpoint() {
        let (app, _dir) = setup_app();

        // Create topic and two notes
        let resp = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/topics",
                Some(json!({"name": "T"})),
            ))
            .await
            .unwrap();
        let topic = response_json(resp).await;
        let tid = topic["id"].as_str().unwrap();

        let resp = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/notes",
                Some(json!({"title": "A", "content": "a", "topic_ids": [tid]})),
            ))
            .await
            .unwrap();
        let note_a = response_json(resp).await;
        let aid = note_a["id"].as_str().unwrap();

        let resp = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/notes",
                Some(json!({"title": "B", "content": "b", "topic_ids": [tid]})),
            ))
            .await
            .unwrap();
        let note_b = response_json(resp).await;
        let bid = note_b["id"].as_str().unwrap();

        // Add reference A → B
        let resp = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/references",
                Some(json!({"source_note_id": aid, "target_note_id": bid})),
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::CREATED);

        // Get forward links for A
        let resp = app
            .clone()
            .oneshot(json_request(
                "GET",
                &format!("/api/notes/{aid}/forward-links"),
                None,
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let forward = response_json(resp).await;
        assert_eq!(forward.as_array().unwrap().len(), 1);
        assert_eq!(forward[0]["target_note_id"], bid);

        // Forward links for B should be empty
        let resp = app
            .clone()
            .oneshot(json_request(
                "GET",
                &format!("/api/notes/{bid}/forward-links"),
                None,
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let forward_b = response_json(resp).await;
        assert!(forward_b.as_array().unwrap().is_empty());
    }

    #[tokio::test]
    async fn delete_note_marks_inbound_refs_broken() {
        let (app, _dir) = setup_app();

        // Create topic and two notes
        let resp = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/topics",
                Some(json!({"name": "T"})),
            ))
            .await
            .unwrap();
        let topic = response_json(resp).await;
        let tid = topic["id"].as_str().unwrap();

        let resp = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/notes",
                Some(json!({"title": "A", "content": "a", "topic_ids": [tid]})),
            ))
            .await
            .unwrap();
        let note_a = response_json(resp).await;
        let aid = note_a["id"].as_str().unwrap();

        let resp = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/notes",
                Some(json!({"title": "B", "content": "b", "topic_ids": [tid]})),
            ))
            .await
            .unwrap();
        let note_b = response_json(resp).await;
        let bid = note_b["id"].as_str().unwrap();

        // Add reference A → B
        app.clone()
            .oneshot(json_request(
                "POST",
                "/api/references",
                Some(json!({"source_note_id": aid, "target_note_id": bid})),
            ))
            .await
            .unwrap();

        // Delete B - should mark A's ref to B as broken
        let resp = app
            .clone()
            .oneshot(json_request("DELETE", &format!("/api/notes/{bid}"), None))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::NO_CONTENT);

        // A's forward links should show broken ref to B
        let resp = app
            .clone()
            .oneshot(json_request(
                "GET",
                &format!("/api/notes/{aid}/forward-links"),
                None,
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let forward = response_json(resp).await;
        assert_eq!(forward.as_array().unwrap().len(), 1);
        assert_eq!(forward[0]["target_note_id"], bid);
        assert_eq!(forward[0]["broken"], true);
    }
}
