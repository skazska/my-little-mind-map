pub mod error;
pub mod fs;
pub mod indexes;
pub mod storage;

pub use error::StorageError;
pub use fs::FsStorage;
pub use indexes::{DefinitionsIndex, LabelsIndex, ReferencesIndex, SpacesIndex};
pub use storage::Storage;

pub type Result<T> = std::result::Result<T, StorageError>;
