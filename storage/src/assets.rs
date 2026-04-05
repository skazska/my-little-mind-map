use shared::model::{Asset, SourceType};
use uuid::Uuid;

use crate::notes::{read_note_meta, update_note_meta};
use crate::{Result, StorageError, StorageHandle};

fn assets_dir(handle: &StorageHandle, note_id: &Uuid) -> std::path::PathBuf {
    handle.notes_dir().join(note_id.to_string()).join("assets")
}

pub fn save_asset(
    handle: &StorageHandle,
    note_id: Uuid,
    filename: &str,
    mime_type: &str,
    source_type: SourceType,
    data: &[u8],
) -> Result<Asset> {
    let dir = assets_dir(handle, &note_id);
    std::fs::create_dir_all(&dir)?;

    let asset = Asset::new(
        filename.to_string(),
        mime_type.to_string(),
        data.len() as u64,
        note_id,
        source_type,
    );

    // Write file using asset id + original extension to avoid name collisions
    let ext = std::path::Path::new(filename)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");
    let stored_name = if ext.is_empty() {
        asset.id.to_string()
    } else {
        format!("{}.{}", asset.id, ext)
    };
    std::fs::write(dir.join(&stored_name), data)?;

    // Update note meta to track this asset
    let mut meta = read_note_meta(handle, &note_id)?;
    meta.assets.push(asset.clone());
    update_note_meta(handle, &meta)?;

    Ok(asset)
}

pub fn read_asset(handle: &StorageHandle, note_id: Uuid, asset_id: Uuid) -> Result<Vec<u8>> {
    let meta = read_note_meta(handle, &note_id)?;
    let asset = meta
        .assets
        .iter()
        .find(|a| a.id == asset_id)
        .ok_or_else(|| StorageError::NotFound(format!("Asset {asset_id} not found")))?;

    let ext = std::path::Path::new(&asset.filename)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");
    let stored_name = if ext.is_empty() {
        asset_id.to_string()
    } else {
        format!("{asset_id}.{ext}")
    };

    let path = assets_dir(handle, &note_id).join(stored_name);
    if !path.exists() {
        return Err(StorageError::NotFound(format!(
            "Asset file for {asset_id} not found"
        )));
    }
    Ok(std::fs::read(path)?)
}

pub fn delete_asset(handle: &StorageHandle, note_id: Uuid, asset_id: Uuid) -> Result<()> {
    let mut meta = read_note_meta(handle, &note_id)?;
    let asset = meta
        .assets
        .iter()
        .find(|a| a.id == asset_id)
        .ok_or_else(|| StorageError::NotFound(format!("Asset {asset_id} not found")))?
        .clone();

    let ext = std::path::Path::new(&asset.filename)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");
    let stored_name = if ext.is_empty() {
        asset_id.to_string()
    } else {
        format!("{asset_id}.{ext}")
    };

    let path = assets_dir(handle, &note_id).join(stored_name);
    if path.exists() {
        std::fs::remove_file(path)?;
    }

    meta.assets.retain(|a| a.id != asset_id);
    update_note_meta(handle, &meta)?;
    Ok(())
}

pub fn list_assets(handle: &StorageHandle, note_id: Uuid) -> Result<Vec<Asset>> {
    let meta = read_note_meta(handle, &note_id)?;
    Ok(meta.assets)
}
