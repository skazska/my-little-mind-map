use shared::model::Topic;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{Result, StorageError, StorageHandle};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TopicsFile {
    pub topics: Vec<Topic>,
}

fn topics_path(handle: &StorageHandle) -> std::path::PathBuf {
    handle.topics_dir().join("topics.json")
}

fn read_topics_file(handle: &StorageHandle) -> Result<TopicsFile> {
    let file = std::fs::File::open(topics_path(handle))?;
    let tf: TopicsFile = serde_json::from_reader(file)?;
    Ok(tf)
}

fn write_topics_file(handle: &StorageHandle, tf: &TopicsFile) -> Result<()> {
    let file = std::fs::File::create(topics_path(handle))?;
    serde_json::to_writer_pretty(file, tf)?;
    Ok(())
}

pub fn create_topic(handle: &StorageHandle, topic: &Topic) -> Result<()> {
    let mut tf = read_topics_file(handle)?;
    if tf.topics.iter().any(|t| t.id == topic.id) {
        return Err(StorageError::AlreadyExists(format!(
            "Topic {} already exists",
            topic.id
        )));
    }
    if tf.topics.iter().any(|t| t.name == topic.name) {
        return Err(StorageError::AlreadyExists(format!(
            "Topic with name '{}' already exists",
            topic.name
        )));
    }
    tf.topics.push(topic.clone());
    write_topics_file(handle, &tf)
}

pub fn read_topic(handle: &StorageHandle, id: &Uuid) -> Result<Topic> {
    let tf = read_topics_file(handle)?;
    tf.topics
        .into_iter()
        .find(|t| t.id == *id)
        .ok_or_else(|| StorageError::NotFound(format!("Topic {id} not found")))
}

pub fn update_topic(handle: &StorageHandle, topic: &Topic) -> Result<()> {
    let mut tf = read_topics_file(handle)?;
    let pos = tf
        .topics
        .iter()
        .position(|t| t.id == topic.id)
        .ok_or_else(|| StorageError::NotFound(format!("Topic {} not found", topic.id)))?;
    // Check name uniqueness against other topics
    if tf
        .topics
        .iter()
        .any(|t| t.id != topic.id && t.name == topic.name)
    {
        return Err(StorageError::AlreadyExists(format!(
            "Topic with name '{}' already exists",
            topic.name
        )));
    }
    tf.topics[pos] = topic.clone();
    write_topics_file(handle, &tf)
}

pub fn delete_topic(handle: &StorageHandle, id: &Uuid) -> Result<()> {
    let mut tf = read_topics_file(handle)?;
    let len_before = tf.topics.len();
    tf.topics.retain(|t| t.id != *id);
    if tf.topics.len() == len_before {
        return Err(StorageError::NotFound(format!("Topic {id} not found")));
    }
    write_topics_file(handle, &tf)
}

pub fn list_topics(handle: &StorageHandle) -> Result<Vec<Topic>> {
    let tf = read_topics_file(handle)?;
    Ok(tf.topics)
}
