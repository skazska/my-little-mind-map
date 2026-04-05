# Task 2.3 — Topic Management

> Implement topic CRUD and typed topic relations in the desktop app.

| | |
|---|---|
| **Phase** | [Phase 2: Desktop App — Write & Classify](../POC-phase-2-status.md) |
| **Requirements** | P2-R7, P2-R8, FR-D5.1–D5.6 |
| **Decisions** | D-004 (topic graph, typed relations) |
| **Depends on** | Phase 1 (1.2, 1.3, 1.4) |
| **Blocks** | 2.5, Phase 4 (4.1) |
| **Status** | Not started |

---

## Goal

Build topic management in the desktop app: create, rename, delete topics, and manage typed relations between topics.

## Scope

### CRUX Events (add to `shared/src/app.rs`)

- `CreateTopic { name, description }` — create new topic
- `UpdateTopic { id, name, description }` — rename/update topic
- `DeleteTopic { id }` — delete topic (validate no orphaned notes)
- `AddTopicRelation { source_id, target_id, relation_type }` — create typed relation
- `RemoveTopicRelation { source_id, target_id }` — remove relation

### Validation Rules

- Topic name must be non-empty and unique
- Cannot delete a topic that is the sole classifier of any note (D-011 — would violate "≥1 topic" constraint)
- Topic relation types limited to: `subtopic-of`, `related-to`, `classifies` (D-004)
- No self-referential relations (source ≠ target)

### React Components

- `components/TopicList.tsx` — list all topics with search
- `components/TopicEditor.tsx` — create/edit topic (name, description)
- `components/TopicRelationManager.tsx` — add/remove/view typed relations between topics
- Integrate into app layout (sidebar or dedicated view)

### Topic Graph Display (Minimal)

For POC: show topic relations as a flat list per topic (e.g., "Subtopics: A, B; Related: C"). Full graph visualization deferred to MVP2 (D-007).

## Tests

- [ ] Create topic → appears in topic list and storage
- [ ] Rename topic → name updates in list and storage
- [ ] Delete topic with no sole-classified notes → succeeds
- [ ] Delete topic that is sole classifier → rejected with error message
- [ ] Add topic relation → visible from both topics
- [ ] Relation type constraints enforced
- [ ] No self-referential relations allowed

## Acceptance Criteria

- [ ] User can create, rename, and delete topics
- [ ] User can create typed relations between topics (subtopic-of, related-to, classifies)
- [ ] Validation prevents orphaned notes (D-011)
- [ ] Topic list is searchable
- [ ] Topic relations visible from both sides
- [ ] All topic data persisted to local storage
