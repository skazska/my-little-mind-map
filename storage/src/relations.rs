use serde::{Deserialize, Serialize};
use shared::model::{Classification, NoteReference, TopicRelation};
use uuid::Uuid;

use crate::notes::NoteSummary;
use crate::{Result, StorageError, StorageHandle};

// ---- Index file types ----

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ClassificationsIndex {
    pub classifications: Vec<Classification>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ReferencesIndex {
    pub references: Vec<NoteReference>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TopicRelationsIndex {
    pub relations: Vec<TopicRelation>,
}

// ---- File helpers ----

fn classifications_path(handle: &StorageHandle) -> std::path::PathBuf {
    handle.index_dir().join("classifications.json")
}

fn references_path(handle: &StorageHandle) -> std::path::PathBuf {
    handle.index_dir().join("references.json")
}

fn topic_relations_path(handle: &StorageHandle) -> std::path::PathBuf {
    handle.index_dir().join("relations.json")
}

fn read_classifications(handle: &StorageHandle) -> Result<ClassificationsIndex> {
    let file = std::fs::File::open(classifications_path(handle))?;
    Ok(serde_json::from_reader(file)?)
}

fn write_classifications(handle: &StorageHandle, idx: &ClassificationsIndex) -> Result<()> {
    let path = classifications_path(handle);
    let tmp = path.with_extension("json.tmp");
    let file = std::fs::File::create(&tmp)?;
    serde_json::to_writer_pretty(file, idx)?;
    crate::atomic_replace(&tmp, &path)?;
    Ok(())
}

fn read_references(handle: &StorageHandle) -> Result<ReferencesIndex> {
    let file = std::fs::File::open(references_path(handle))?;
    Ok(serde_json::from_reader(file)?)
}

fn write_references(handle: &StorageHandle, idx: &ReferencesIndex) -> Result<()> {
    let path = references_path(handle);
    let tmp = path.with_extension("json.tmp");
    let file = std::fs::File::create(&tmp)?;
    serde_json::to_writer_pretty(file, idx)?;
    crate::atomic_replace(&tmp, &path)?;
    Ok(())
}

fn read_topic_relations(handle: &StorageHandle) -> Result<TopicRelationsIndex> {
    let file = std::fs::File::open(topic_relations_path(handle))?;
    Ok(serde_json::from_reader(file)?)
}

fn write_topic_relations(handle: &StorageHandle, idx: &TopicRelationsIndex) -> Result<()> {
    let path = topic_relations_path(handle);
    let tmp = path.with_extension("json.tmp");
    let file = std::fs::File::create(&tmp)?;
    serde_json::to_writer_pretty(file, idx)?;
    crate::atomic_replace(&tmp, &path)?;
    Ok(())
}

// ---- Classification operations ----

pub fn classify_note(handle: &StorageHandle, note_id: Uuid, topic_id: Uuid) -> Result<()> {
    let mut idx = read_classifications(handle)?;
    if idx
        .classifications
        .iter()
        .any(|c| c.note_id == note_id && c.topic_id == topic_id)
    {
        return Err(StorageError::AlreadyExists(format!(
            "Classification ({note_id}, {topic_id}) already exists"
        )));
    }
    idx.classifications
        .push(Classification::new(note_id, topic_id));
    write_classifications(handle, &idx)
}

pub fn unclassify_note(handle: &StorageHandle, note_id: Uuid, topic_id: Uuid) -> Result<()> {
    let mut idx = read_classifications(handle)?;
    let len_before = idx.classifications.len();
    idx.classifications
        .retain(|c| !(c.note_id == note_id && c.topic_id == topic_id));
    if idx.classifications.len() == len_before {
        return Err(StorageError::NotFound(format!(
            "Classification ({note_id}, {topic_id}) not found"
        )));
    }
    write_classifications(handle, &idx)
}

pub fn get_note_topic_ids(handle: &StorageHandle, note_id: Uuid) -> Result<Vec<Uuid>> {
    let idx = read_classifications(handle)?;
    Ok(idx
        .classifications
        .iter()
        .filter(|c| c.note_id == note_id)
        .map(|c| c.topic_id)
        .collect())
}

pub fn get_topic_note_ids(handle: &StorageHandle, topic_id: Uuid) -> Result<Vec<Uuid>> {
    let idx = read_classifications(handle)?;
    Ok(idx
        .classifications
        .iter()
        .filter(|c| c.topic_id == topic_id)
        .map(|c| c.note_id)
        .collect())
}

pub fn get_note_topics(handle: &StorageHandle, note_id: Uuid) -> Result<Vec<shared::model::Topic>> {
    let topic_ids: std::collections::HashSet<Uuid> =
        get_note_topic_ids(handle, note_id)?.into_iter().collect();
    let all_topics = crate::topics::list_topics(handle)?;
    Ok(all_topics
        .into_iter()
        .filter(|t| topic_ids.contains(&t.id))
        .collect())
}

pub fn get_topic_notes(handle: &StorageHandle, topic_id: Uuid) -> Result<Vec<NoteSummary>> {
    let note_ids = get_topic_note_ids(handle, topic_id)?;
    let mut summaries = Vec::new();
    for nid in note_ids {
        match crate::notes::read_note_meta(handle, &nid) {
            Ok(meta) => summaries.push(NoteSummary::from(&meta)),
            Err(StorageError::NotFound(_)) => {} // orphaned classification, skip
            Err(e) => return Err(e),
        }
    }
    Ok(summaries)
}

/// Remove all classifications for a given note (used when deleting a note).
pub fn remove_note_classifications(handle: &StorageHandle, note_id: Uuid) -> Result<()> {
    let mut idx = read_classifications(handle)?;
    idx.classifications.retain(|c| c.note_id != note_id);
    write_classifications(handle, &idx)
}

/// Remove all classifications for a given topic (used when deleting a topic).
pub fn remove_topic_classifications(handle: &StorageHandle, topic_id: Uuid) -> Result<()> {
    let mut idx = read_classifications(handle)?;
    idx.classifications.retain(|c| c.topic_id != topic_id);
    write_classifications(handle, &idx)
}

// ---- Note reference operations ----

pub fn add_reference(handle: &StorageHandle, reference: &NoteReference) -> Result<()> {
    if reference.source_note_id == reference.target_note_id {
        return Err(StorageError::InvalidData(
            "Source and target note must be different".to_string(),
        ));
    }
    let mut idx = read_references(handle)?;
    if idx.references.iter().any(|r| {
        r.source_note_id == reference.source_note_id && r.target_note_id == reference.target_note_id
    }) {
        return Err(StorageError::AlreadyExists(format!(
            "Reference ({}, {}) already exists",
            reference.source_note_id, reference.target_note_id
        )));
    }
    idx.references.push(reference.clone());
    write_references(handle, &idx)
}

pub fn remove_reference(
    handle: &StorageHandle,
    source_note_id: Uuid,
    target_note_id: Uuid,
) -> Result<()> {
    let mut idx = read_references(handle)?;
    let len_before = idx.references.len();
    idx.references
        .retain(|r| !(r.source_note_id == source_note_id && r.target_note_id == target_note_id));
    if idx.references.len() == len_before {
        return Err(StorageError::NotFound(format!(
            "Reference ({source_note_id}, {target_note_id}) not found"
        )));
    }
    write_references(handle, &idx)
}

pub fn get_backlinks(handle: &StorageHandle, note_id: Uuid) -> Result<Vec<NoteReference>> {
    let idx = read_references(handle)?;
    Ok(idx
        .references
        .into_iter()
        .filter(|r| r.target_note_id == note_id)
        .collect())
}

/// Remove all references involving a note (used when deleting a note).
pub fn remove_note_references(handle: &StorageHandle, note_id: Uuid) -> Result<()> {
    let mut idx = read_references(handle)?;
    idx.references
        .retain(|r| r.source_note_id != note_id && r.target_note_id != note_id);
    write_references(handle, &idx)
}

// ---- Topic relation operations ----

pub fn add_topic_relation(handle: &StorageHandle, rel: &TopicRelation) -> Result<()> {
    if rel.source_topic_id == rel.target_topic_id {
        return Err(StorageError::InvalidData(
            "Source and target topic must be different".to_string(),
        ));
    }
    let mut idx = read_topic_relations(handle)?;
    if idx.relations.iter().any(|r| {
        r.source_topic_id == rel.source_topic_id && r.target_topic_id == rel.target_topic_id
    }) {
        return Err(StorageError::AlreadyExists(format!(
            "Topic relation ({}, {}) already exists",
            rel.source_topic_id, rel.target_topic_id
        )));
    }
    idx.relations.push(rel.clone());
    write_topic_relations(handle, &idx)
}

pub fn remove_topic_relation(
    handle: &StorageHandle,
    source_topic_id: Uuid,
    target_topic_id: Uuid,
) -> Result<()> {
    let mut idx = read_topic_relations(handle)?;
    let len_before = idx.relations.len();
    idx.relations.retain(|r| {
        !(r.source_topic_id == source_topic_id && r.target_topic_id == target_topic_id)
    });
    if idx.relations.len() == len_before {
        return Err(StorageError::NotFound(format!(
            "Topic relation ({source_topic_id}, {target_topic_id}) not found"
        )));
    }
    write_topic_relations(handle, &idx)
}

pub fn get_topic_relations(handle: &StorageHandle, topic_id: Uuid) -> Result<Vec<TopicRelation>> {
    let idx = read_topic_relations(handle)?;
    Ok(idx
        .relations
        .into_iter()
        .filter(|r| r.source_topic_id == topic_id || r.target_topic_id == topic_id)
        .collect())
}

/// Remove all relations involving a topic (used when deleting a topic).
pub fn remove_topic_all_relations(handle: &StorageHandle, topic_id: Uuid) -> Result<()> {
    let mut idx = read_topic_relations(handle)?;
    idx.relations
        .retain(|r| r.source_topic_id != topic_id && r.target_topic_id != topic_id);
    write_topic_relations(handle, &idx)
}

// ---- Bulk load operations (for syncing model from storage) ----

/// Load all classifications from storage.
pub fn load_all_classifications(handle: &StorageHandle) -> Result<Vec<Classification>> {
    Ok(read_classifications(handle)?.classifications)
}

/// Load all note references from storage.
pub fn load_all_references(handle: &StorageHandle) -> Result<Vec<NoteReference>> {
    Ok(read_references(handle)?.references)
}

/// Load all topic relations from storage.
pub fn load_all_topic_relations(handle: &StorageHandle) -> Result<Vec<TopicRelation>> {
    Ok(read_topic_relations(handle)?.relations)
}
