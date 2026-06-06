# Expectations

This document codifies the high-level business/user expectations for the MyLittleMindMap product. Expectations use the `E-*` codification scheme and sit at the top of the traceability chain: **expectation → spec → test cases → tests → code implementation** (see [specs](specs.md) and [AGENTS.md](../AGENTS.md)).

Expectations are intentionally high-level; the detail lives in the technical [specs](specs.md). Each expectation records the spec families it covers and its POC status. The Proof-of-Concept (POC) targets the **Desktop and Web** apps; mobile and several advanced features are deferred.

Status legend:

- **In-POC** — expected to be satisfied within the POC.
- **Deferred** — out of scope for the POC; tracked for later iterations. Some deferred expectations map to specs currently marked `[TBD]`.

## Product feature policies

- [E-P-HAI] **Both AI and Human usability optimization.**: maximum UX/UI and data usable, accessible, structured, and presented in a way that optimizes for both human users and AI agents with minimum friction while requiuing minimum development and support effort.
- [E-P-APPLY-RANGE] **APPLY-RANGE.**: Maximim wide range of product applicability, from personal note-taking to team project management, knowledge base, and agent memory with minimum use friction, while requiring minimum development and support effort.  

## Functional Expectations

- [E-TEXT] **Text-centric content.** Markdown notes are the source of truth; other artifacts are referenced from text; metadata is derived from content.
- [E-INTERLINK] **Rich interlinking.** Notes tree, topics/labels, named views, spaces, and bi-directional note references tie content together.
- [E-EDIT] **Note authoring and navigation.** Users create, edit, and navigate notes across spaces, labels, and views, with a markdown editor and app frame.
- [E-MUTATE] **Mutation semantics.** Move, rename, and delete semantics for notes and structural elements, including reference handling and attachment lifecycle.
- [E-INTENTIONS] **Intention-driven launch.** The app can be launched with an intention (e.g. open a specific note or view, create a new note in a specific space) that directs the initial content and context.
- [E-RESPONSIVE] **Responsive behavior.** The app adapts to different screen sizes and orientations, with a consistent core experience across platforms.
- [E-ERRORS] **Graceful error handling.** The app handles errors gracefully, providing informative feedback to users and avoiding data loss or corruption.

## UI/UX

- [E-UX] **Minimalistic, intuitive, responsive UI/UX.** A clean, modern interface that surfaces powerful features without overwhelming users. Detailed in [UX expectations](./expectations/ux-expectations.md) (`E-UX-*` sub-codes, screen wireframes, and user flows).

## Non-Functional Expectations

- [E-LOCAL-FIRST] **Local-first storage.** Content is stored locally as a folder-note structure, VCS hosting; the app is fully usable offline.
- [E-SYNC] **Cloud sync.** Optional sync to git-compatible cloud storage with conflict handling delegated to git.
- [E-CROSS-PLATFORM] **Cross-platform core.** Shared core logic across platforms ensures consistent behavior and easier maintenance; Same UI/UX on all platforms, as much as possible given platform conventions and constraints.
- [E-STANDARDS] **Standards, readability, and performance.** Prefer standards and human-readable formats over custom solutions; performance and scalability matter. Cross-cutting constraint reflected in human-readable persistence (markdown, JSON indexes), markdown editor, and git-based sync.
- [E-MINIMAL-ACTIONS] **Minimal user actions.** Minimize the number of user actions and diversity of action types required to accomplish tasks, while keeping non-restrictive; prefer intuitive defaults and natural input that reduce friction.
