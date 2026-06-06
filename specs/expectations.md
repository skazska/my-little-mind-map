# Expectations

This document codifies the high-level business/user expectations for the MyLittleMindMap product. Expectations use the `E-*` codification scheme and sit at the top of the traceability chain: **expectation → spec → test cases → tests → code implementation** (see [specs](specs.md) and [AGENTS.md](../AGENTS.md)).

Expectations are intentionally high-level; the detail lives in the technical [specs](specs.md). Each expectation records the spec families it covers and its POC status. The Proof-of-Concept (POC) targets the **Desktop and Web** apps; mobile and several advanced features are deferred.

Status legend (each expectation is tagged with one):

- **In-POC** — expected to be satisfied within the POC.
- **Deferred** — out of scope for the POC; tracked for later iterations. Some deferred expectations map to specs currently marked `[TBD]`.
- **Partial-POC** — partially satisfied within the POC; the remainder is deferred and called out inline.

## Product feature policies

These are **global, cross-cutting policies**, not ordinary expectations. They constrain and qualify *every* expectation in this document. By design they are **not** placed in the per-spec traceability chain (`E-* → S-* → TC-*`) and are **not** referenced individually from specs or from other expectations: every functional, UI/UX, and non-functional expectation is read as already qualified by both policies. They are asserted by review (e.g. SpecsQA), not by a single spec.

- [E-P-HAI] **Human- and AI-usability optimization.** Data and UX/UI are structured, accessible, and presented so they are usable with minimum friction by both human users and AI agents, while requiring minimum development and support effort. Concretely, this favours plain-text/markdown as source of truth, human- and machine-readable derived indexes, stable identifiers, and deterministic structure (see [AI-agent fitness](#ai-agent-fitness) below).
- [E-P-APPLY-RANGE] **Wide applicability.** The product targets a wide range of use cases — from personal note-taking to team project management, knowledge base, and agent memory — with minimum use friction, while requiring minimum development and support effort. Applicability is achieved by composing the same general primitives (notes, spaces, labels, views, references) rather than by use-case-specific features.

### AI-agent fitness

Assertion of how the expectations below serve the AI-usability half of [E-P-HAI]. Most claims are assertable by inspection of the specs/persistence; a few need a proving test, suggested inline.

| Expectation | Why it serves AI agents | Assertable by inspection? |
| --- | --- | --- |
| [E-TEXT] | Markdown files are the source of truth; no opaque/binary store an agent must reverse-engineer. | Yes — inspect persisted note files. |
| [E-INTERLINK] | Stable note IDs and `note://` references give agents a deterministic link graph; derived JSON indexes (`references.json`, `labels.json`) are machine-readable. | Yes — inspect indexes; **suggested test**: an agent resolves a `note://` reference to the correct file. |
| [E-STANDARDS] | Human-readable markdown + JSON indexes are standard, parseable formats; no custom syntax persisted. | Yes — inspect formats; cross-check [S-UX-NE2](specs/ux.md) strips editor commands before save. |
| [E-LOCAL-FIRST] | Content lives in a plain folder-note tree an agent can read/write directly, offline, without the app running. | Yes — inspect data-folder layout. |
| [E-INTENTIONS] | Intention-driven launch (e.g. `note://`) gives agents a programmatic entry point to a target note/view. | Partially — **suggested test**: launch with an intention and assert the resolved initial context. |
| [E-MINIMAL-ACTIONS] | Few, composable action types reduce the surface an agent must learn to drive the product. | By review. |

Where a row is not fully assertable by inspection, the suggested test is a candidate for a future `TC-*` (not authored here).

## Functional Expectations

- [E-TEXT] **Text-centric content.** Markdown notes are the source of truth; other artifacts are referenced from text; metadata is derived from content. *In-POC.*
- [E-INTERLINK] **Rich interlinking.** Notes tree, topics/labels, named views, spaces, and bi-directional note references tie content together. *Partial-POC — note/space/label/view references and bi-directional note references are in-POC; block-level reference anchoring and the interactive reference composer ([S-DM-NR5](specs/data-model.md), [S-DM-NR6](specs/data-model.md)) are deferred.*
- [E-EDIT] **Note authoring and navigation.** Users create, edit, and navigate notes across spaces, labels, and views, with a markdown editor and app frame. *In-POC.*
- [E-MUTATE] **Mutation semantics.** Move, rename, and delete semantics for notes and structural elements, including reference handling and attachment lifecycle. *Partial-POC — note deletion (including empty-draft removal) is in-POC; move/rename of notes and spaces, reference rewriting, and attachment lifecycle ([S-DM-MV1](specs/data-model.md)–[S-DM-MV4](specs/data-model.md)) are deferred.*
- [E-INTENTIONS] **Intention-driven launch.** The app can be launched with an intention (e.g. open a specific note or view, create a new note in a specific space) that directs the initial content and context. *In-POC.*
- [E-RESPONSIVE] **Responsive behavior.** The app adapts to different screen sizes and orientations with a consistent core experience across platforms. Scope is **layout adaptation** (viewport size/orientation); visual theming and light/dark appearance are a separate concern owned by [E-UX-THEME](./expectations/ux-expectations.md) (deferred). *In-POC.*
- [E-ERRORS] **Graceful error handling.** The app handles errors gracefully, providing informative feedback to users and avoiding data loss or corruption. *In-POC.*

## UI/UX

- [E-UX] **Minimalistic, intuitive, responsive UI/UX.** A clean, modern interface that surfaces powerful features without overwhelming users. Detailed in [UX expectations](./expectations/ux-expectations.md) (`E-UX-*` sub-codes, screen wireframes, and user flows). *In-POC (except [E-UX-THEME], deferred).*

## Non-Functional Expectations

- [E-LOCAL-FIRST] **Local-first storage.** Content is stored locally as a human-readable folder-note structure and the app is fully usable offline. The local store is a plain folder that can itself be a version-controlled (git) working tree, so the same files are both the app's source of truth and the unit of versioning/sync. *Partial-POC — desktop filesystem storage and a minimum non-stub web-app local store ([S-ST-LS3](specs/storage.md)) are in-POC; the mobile store ([S-ST-LS4](specs/storage.md)) is deferred.*
- [E-SYNC] **Sync via version control.** Sync is **delegated to version-control hosting** rather than built as a bespoke product feature: because content is plain files in a git working tree ([E-LOCAL-FIRST]), syncing and conflict handling reduce to standard git operations against a hosting provider, with markdown text-merged and derived indexes regenerated from content. *Deferred — POC proves local-first; git-hosting sync is post-POC.*
  - **Decision (resolved):** to make version-control-hosting sync *plausible* from the web app, the POC provides a minimum non-stub web local store whose layout maps cleanly onto a git working tree ([S-ST-LS3](specs/storage.md)). The web stub store is replaced; sync itself remains post-POC.
- [E-CROSS-PLATFORM] **Cross-platform core.** Shared core logic across platforms ensures consistent behavior and easier maintenance; the same UI/UX is presented on all platforms as much as platform conventions and constraints allow. Platform deviations are specified, not incidental — e.g. the web shell has no data-folder dialog on first launch ([S-UX-SA1](specs/ux.md), [S-CFG-1](specs/config.md)), and narrow viewports may omit some metadata fields ([S-UX-NE1](specs/ux.md)). *In-POC (desktop + web; mobile deferred).*
- [E-STANDARDS] **Standards, readability, and performance.** Prefer standards and human-readable formats over custom solutions; performance and scalability matter. Cross-cutting constraint reflected in human-readable persistence (markdown, JSON indexes), markdown editor, and git-based sync. *In-POC.*
- [E-MINIMAL-ACTIONS] **Minimal user actions.** Minimize the number of user actions and diversity of action types required to accomplish tasks, while keeping non-restrictive; prefer intuitive defaults and natural input that reduce friction. *In-POC.*
