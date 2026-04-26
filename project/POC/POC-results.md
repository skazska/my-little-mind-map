# POC Results

This document summarizes the results of POC.
Aggregates feedback, learnings, and outcomes from all POC phases.

Possible decisions to go forward with implementation, pivot, or scrap the project based on POC findings.

## mdast

1. mdast is actually a format.
2. [mdast spike results](POC-phase-2/mdast-evaluation.md) to use `markdown` crate in Rust and `remark-parse` in JS for cross-platform AST compatibility doesn't look satisfactory at th end:
    - dublicate AST logic in Rust and JS
    - need to investigate additionally whar cases require `serde` support for `Node` (e.g., storing references in index)
    - need additional research on markdown parsing in Rust to find better options (other crates, or extending `markdown` crate with serde support)

## note referencing and identification

Using uuid for note identification in references is not user-friendly nor text-centric (see `IDEA##Key`).

Need to concider use of links format and URI for note referencing and identification, e.g., `[text](note://<subtopic.topic>/<note/subnote>#title?fragment)`

This would require changes to:

    - the markdown syntax, parser, renderer, and reference extraction logic
    - topic relations, classification, and search (to support note URI as identifier instead of uuid)

This would eliminate the need to support custom AST node for internal references and mdast dilemma, as the same markdown syntax and AST node can be used for both internal and external links.

### suggestions

1. Direct topic hierarchy tree to be stored in index so any topic can be identified by its path.
    - allow to uniquely identify topic as url.
    - allow to controll no note title duplication within a topic (enforce unique root note titles within a topic) to ensure note URI is unique and human-friendly.
    - use topic path as domain in note URI to distinguish notes with same title in different topics (e.g., `note://project/notes/meeting-notes` vs `note://personal/notes/meeting-notes`).
2. Keep user configurable topic relations and classification but not use them for note identification and referencing.
3. Allow note hierarchy and store it in index as `note_path` along with `parent_id` to allow referencing notes by their path in the hierarchy (e.g., `note://project/notes/meeting-notes`).
4. Keep using uuid for internal note identification, including in bidirectional links and reference index, but add `note_path` as a property of the note in the index to allow referencing by path in the markdown syntax and UI.
    - will need to keep `note_path` in sync with `parent_id`
5. Allow note to be classified under multiple root topics but enforce unique note titles within each root topic to ensure note URI is unique and human-friendly.
6. Allow topic and note direct hierarchy management via special actions only to ensure syncs and consistency including links in note content.
    - e.g., `MoveNote { note_id, new_parent_id }` and `RenameNote { note_id, new_title }` actions that:
        - updates the note's `parent_id`, `note_path` for this note and all its descendants,
        - prevents conflicting note titles and paths.
        - and triggers reference index sync to update all links in note content that reference this note by path.
    - e.g., `MoveTopic { topic_path, new_parent_topic_path }` and `RenameTopic { topic_path, new_title }` actions that:
        - updates the topic's parent relation,
        - prevents conflicting topic titles and paths,
        - and triggers reference index sync to update all links in note content that reference notes under this topic by path.
    - e.g., `DeleteNote { note_id }` action that prevents deletion if note is referenced but allows to force deletion in UI with trigger to remove all references.
    - e.g., `DeleteTopic { topic_path, new_title }` action that prevents deletion if any note under this topic or subtopics is referenced but allows to force deletion in UI with trigger to remove non-last topic link of notes or remove all notes with last topic link under this topic.

## UI

UI implementation in POC show tendency to be overloaded with controls.

[IDEA##Key] suggests text-centered approach where text is the keystone.

1. note topics is to be placed in content as with `#topic.subtopic` (or other preferable standard) syntax, saving note must check at least 1 topic link in content presented and update note classification accordingly. It ok to show note topics in metadata/sidebar panel but it should be derived from content and not editable directly from there to avoid sync issues.
2. note title is to be placed in content as with `# Note Title` according to markdown standard, saving note must check title in content and update note title in index accordingly. It ok to show note title in metadata/sidebar panel but it should be derived from content and not editable directly from there to avoid sync issues.
3. note parent-child hierarchy is to be placed in content as with `> [[Parent Note Title]]` (or other preferable standard) syntax, saving note must check parent note link in content and update note parent relation in index accordingly. It ok to show note parent in metadata/sidebar panel but it should be derived from content and not editable directly from there to avoid sync issues.
4. actions like add file, capture screen part, etc. should be triggered from text commands in content like `/add file` or `/capture screen` (or other preferable standard syntax), and not from buttons in UI to avoid overload and to keep text-centered approach.

## Sync to cloud (backend service)

Because of cloudflare announcement of [artifactfs](https://developers.cloudflare.com/artifacts) it worth to reconsider the approach to sync with own backend service via own API and instead use artifactfs to sync local storage with cloud.

This would eliminate the need to implement and maintain a backend service and API for syncing.

This require investigation of artifactfs capabilities and limitations, and redesign of sync logic to work with artifactfs instead of custom API.
