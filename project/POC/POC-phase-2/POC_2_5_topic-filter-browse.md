# Task 2.5 — Topic Filter/Browse View

> Implement a topic-based browsing view: select a topic to see all classified notes.

| | |
|---|---|
| **Phase** | [Phase 2: Desktop App — Write & Classify](../POC-phase-2-status.md) |
| **Requirements** | P2-R10, FR-D5.7, UC-11, NFR-6.3 |
| **Decisions** | D-004 (topic graph) |
| **Depends on** | 2.3 |
| **Blocks** | — |
| **Status** | Done |

---

## Goal

Build a topic browser that lets users navigate by topic: select a topic → see classified notes → drill into subtopics.

## Scope

### React Component

- `components/TopicBrowser.tsx` — topic navigation and filtered note list

### Features

| Feature | Description |
|---------|-------------|
| Topic list | All topics with note count |
| Select topic | Shows notes classified under it |
| Subtopic navigation | Show subtopics (via `subtopic-of` relations) |
| Related topics | Show related topics (via `related-to` relations) |
| Classifying topics | Show topics that classify this topic |
| Click note | Navigate to note editor |

### ViewModel

```rust
pub struct TopicBrowserView {
    pub topics: Vec<TopicListItem>,
    pub selected_topic: Option<TopicDetail>,
    pub filtered_notes: Vec<NoteListItem>,
}

pub struct TopicListItem {
    pub id: Uuid,
    pub name: String,
    pub note_count: usize,
}

pub struct TopicDetail {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub subtopics: Vec<TopicListItem>,
    pub related_topics: Vec<TopicListItem>,
    pub classifying_topics: Vec<TopicListItem>,
}
```

### CRUX Events

- `SelectTopic { id }` — select a topic to filter notes
- `ClearTopicFilter` — show all notes

### Layout

Sidebar (or panel) with topic list. Main area shows filtered notes. Topic detail shows relations.

## Tests

- [ ] Topic list shows all topics with note counts
- [ ] Selecting a topic filters notes correctly
- [ ] Subtopics, related topics, classifying topics displayed
- [ ] Clearing filter shows all notes
- [ ] Performance acceptable for POC scale

## Acceptance Criteria

- [ ] User can browse topics and see classified notes
- [ ] Topic relations (subtopics, related, classifying) visible
- [ ] Navigation from topic → notes → note editor works
- [ ] Performance: topic list loads in < 500ms for 100 topics (NFR-6.3)
