use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use shared_types::{
    ids::{NoteId, SpaceId},
    model::Label,
};

// ── Spaces index ──────────────────────────────────────────────────────────────

/// Hierarchical list of spaces written to `spaces.json`. [S-ST-DM2]
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct SpacesIndex {
    pub spaces: Vec<SpaceEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpaceEntry {
    pub id: SpaceId,
    pub name: String,
    pub description: Option<String>,
    pub labels: Vec<Label>,
    pub parent_id: Option<SpaceId>,
    pub child_ids: Vec<SpaceId>,
    pub note_count: usize,
}

impl SpacesIndex {
    pub fn upsert(&mut self, entry: SpaceEntry) {
        if let Some(existing) = self.spaces.iter_mut().find(|e| e.id == entry.id) {
            *existing = entry;
        } else {
            self.spaces.push(entry);
        }
    }

    pub fn remove(&mut self, id: &SpaceId) {
        self.spaces.retain(|e| &e.id != id);
    }

    pub fn get(&self, id: &SpaceId) -> Option<&SpaceEntry> {
        self.spaces.iter().find(|e| &e.id == id)
    }
}

// ── Labels index ──────────────────────────────────────────────────────────────

/// Maps label string → list of note IDs. Written to `labels.json`. [S-ST-DM2]
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct LabelsIndex {
    pub entries: HashMap<String, Vec<NoteId>>,
}

impl LabelsIndex {
    pub fn add(&mut self, label: &Label, note_id: &NoteId) {
        self.entries
            .entry(label.0.clone())
            .or_default()
            .push(note_id.clone());
    }

    /// Remove all entries for a given note (call before re-indexing on update).
    pub fn remove_note(&mut self, note_id: &NoteId) {
        for ids in self.entries.values_mut() {
            ids.retain(|id| id != note_id);
        }
        // Prune empty label entries per [S-DM-L4].
        self.entries.retain(|_, ids| !ids.is_empty());
    }

    pub fn notes_for_label(&self, label: &str) -> &[NoteId] {
        self.entries.get(label).map(Vec::as_slice).unwrap_or(&[])
    }

    pub fn all_labels(&self) -> Vec<&str> {
        self.entries.keys().map(String::as_str).collect()
    }
}

// ── References index ──────────────────────────────────────────────────────────

/// Forward + backward note reference index. Written to `references.json`. [S-DM-NR5]
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct ReferencesIndex {
    /// source note id → targets
    pub forward: HashMap<String, Vec<RefEntry>>,
    /// target note id → sources
    pub backward: HashMap<String, Vec<RefEntry>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefEntry {
    pub note_id: String,
    pub block_id: Option<String>,
}

impl ReferencesIndex {
    pub fn add(
        &mut self,
        source: &NoteId,
        target: &str,
        source_block: Option<&str>,
        target_block: Option<&str>,
    ) {
        self.forward
            .entry(source.to_string())
            .or_default()
            .push(RefEntry {
                note_id: target.to_string(),
                block_id: target_block.map(str::to_string),
            });
        self.backward
            .entry(target.to_string())
            .or_default()
            .push(RefEntry {
                note_id: source.to_string(),
                block_id: source_block.map(str::to_string),
            });
    }

    /// Remove all forward refs from `source` and their corresponding backlinks.
    pub fn remove_source(&mut self, source: &NoteId) {
        if let Some(targets) = self.forward.remove(&source.to_string()) {
            for t in &targets {
                if let Some(backlinks) = self.backward.get_mut(&t.note_id) {
                    backlinks.retain(|e| e.note_id != source.to_string());
                }
            }
        }
    }
}

// ── Definitions index ─────────────────────────────────────────────────────────

/// Term → definitions map. Written to `definitions.json`. [S-DM-ND2]
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct DefinitionsIndex {
    pub entries: HashMap<String, Vec<DefEntry>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DefEntry {
    pub note_id: NoteId,
    pub definition: String,
    pub block_id: Option<String>,
}

impl DefinitionsIndex {
    pub fn add(
        &mut self,
        term: &str,
        note_id: NoteId,
        definition: String,
        block_id: Option<String>,
    ) {
        self.entries
            .entry(term.to_lowercase())
            .or_default()
            .push(DefEntry {
                note_id,
                definition,
                block_id,
            });
    }

    pub fn remove_note(&mut self, note_id: &NoteId) {
        for entries in self.entries.values_mut() {
            entries.retain(|e| &e.note_id != note_id);
        }
        self.entries.retain(|_, entries| !entries.is_empty());
    }
}
