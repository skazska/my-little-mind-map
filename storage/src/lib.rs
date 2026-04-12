pub mod assets;
pub mod config;
pub mod error;
pub mod notes;
pub mod relations;
pub mod topics;

use std::path::{Path, PathBuf};

pub use error::StorageError;

pub type Result<T> = std::result::Result<T, StorageError>;

/// Atomically replace `dest` by renaming `src` over it.
/// On Unix, `std::fs::rename` overwrites by default.
/// On Windows, `std::fs::rename` fails if dest exists, so we remove it first.
pub(crate) fn atomic_replace(src: &Path, dest: &Path) -> std::io::Result<()> {
    #[cfg(windows)]
    {
        // Best-effort remove; ignore error if dest doesn't exist yet.
        let _ = std::fs::remove_file(dest);
    }
    std::fs::rename(src, dest)
}

/// Handle to an initialized storage root directory.
#[derive(Clone, Debug)]
pub struct StorageHandle {
    root: PathBuf,
}

impl StorageHandle {
    pub fn root(&self) -> &Path {
        &self.root
    }

    pub fn notes_dir(&self) -> PathBuf {
        self.root.join("notes")
    }

    pub fn topics_dir(&self) -> PathBuf {
        self.root.join("topics")
    }

    pub fn index_dir(&self) -> PathBuf {
        self.root.join("index")
    }

    pub fn config_path(&self) -> PathBuf {
        self.root.join("config.json")
    }
}

/// Initialize storage at the given root path, creating the directory structure (D-002).
pub fn init_storage(root: &Path) -> Result<StorageHandle> {
    let handle = StorageHandle {
        root: root.to_path_buf(),
    };

    // Create directory structure
    std::fs::create_dir_all(handle.notes_dir())?;
    std::fs::create_dir_all(handle.topics_dir())?;
    std::fs::create_dir_all(handle.index_dir())?;

    // Initialize config if it doesn't exist
    if !handle.config_path().exists() {
        config::write_default_config(&handle)?;
    }

    // Initialize index files if they don't exist
    let classifications_path = handle.index_dir().join("classifications.json");
    if !classifications_path.exists() {
        serde_json::to_writer_pretty(
            std::fs::File::create(&classifications_path)?,
            &relations::ClassificationsIndex {
                classifications: vec![],
            },
        )?;
    }

    let references_path = handle.index_dir().join("references.json");
    if !references_path.exists() {
        serde_json::to_writer_pretty(
            std::fs::File::create(&references_path)?,
            &relations::ReferencesIndex { references: vec![] },
        )?;
    }

    let relations_path = handle.index_dir().join("relations.json");
    if !relations_path.exists() {
        serde_json::to_writer_pretty(
            std::fs::File::create(&relations_path)?,
            &relations::TopicRelationsIndex { relations: vec![] },
        )?;
    }

    // Initialize topics file if it doesn't exist
    let topics_path = handle.topics_dir().join("topics.json");
    if !topics_path.exists() {
        serde_json::to_writer_pretty(
            std::fs::File::create(&topics_path)?,
            &topics::TopicsFile { topics: vec![] },
        )?;
    }

    Ok(handle)
}
