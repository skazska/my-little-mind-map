use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .init();

    let storage_root = std::env::var("STORAGE_ROOT").unwrap_or_else(|_| "./backend-data".into());
    let user_storage = std::path::PathBuf::from(&storage_root)
        .join("users")
        .join("default");

    let storage =
        storage::init_storage(&user_storage).expect("Failed to initialize backend storage");

    tracing::info!("Storage initialized at {}", user_storage.display());

    let app = backend_service::create_app(storage);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .expect("Failed to bind to port 3000");

    tracing::info!("Backend service listening on http://0.0.0.0:3000");

    axum::serve(listener, app).await.expect("Server error");
}
