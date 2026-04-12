use chrono::Utc;
use serde::{Deserialize, Serialize};

use crate::{Result, StorageHandle};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StorageConfig {
    pub format_version: String,
    pub created_at: String,
}

pub fn write_default_config(handle: &StorageHandle) -> Result<()> {
    let config = StorageConfig {
        format_version: "1.0.0".to_string(),
        created_at: Utc::now().to_rfc3339(),
    };
    let file = std::fs::File::create(handle.config_path())?;
    serde_json::to_writer_pretty(file, &config)?;
    Ok(())
}

pub fn read_config(handle: &StorageHandle) -> Result<StorageConfig> {
    let file = std::fs::File::open(handle.config_path())?;
    let config: StorageConfig = serde_json::from_reader(file)?;
    Ok(config)
}
