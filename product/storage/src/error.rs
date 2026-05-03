#[derive(Debug, thiserror::Error)]
pub enum StorageError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("front-matter error: {0}")]
    FrontMatter(#[from] shared_types::FrontMatterError),

    #[error("invalid ID: {0}")]
    InvalidId(#[from] shared_types::IdError),

    #[error("not found: {0}")]
    NotFound(String),
}
