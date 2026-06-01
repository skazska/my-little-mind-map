# Expectations

This document codifies the high-level business/user expectations for the MyLittleMindMap product. Expectations use the `E-*` codification scheme and sit at the top of the traceability chain: **expectation → spec → test cases → tests → code implementation** (see [specs](specs.md) and [AGENTS.md](../AGENTS.md)).

Expectations are intentionally high-level; the detail lives in the technical [specs](specs.md). Each expectation records the spec families it covers and its POC status. The Proof-of-Concept (POC) targets the **Desktop and Web** apps; mobile and several advanced features are deferred.

Status legend:

- **In-POC** — expected to be satisfied within the POC.
- **Deferred** — out of scope for the POC; tracked for later iterations. Some deferred expectations map to specs currently marked `[TBD]`.

## Functional Expectations

- [E-TEXT] **Text-centric content.** Markdown notes are the source of truth; other artifacts are referenced from text; metadata is derived from content. Covers `S-DM-N*` (notes and YAML frontmatter, incl. `S-DM-N5`/`S-DM-N6`), `S-DM-ND*` (definitions derived from content). _In-POC._
- [E-INTERLINK] **Rich interlinking.** Notes tree, topics/labels, named views, spaces, and bi-directional note references tie content together. Covers `S-DM-L*` (labels), `S-DM-V*` (views), `S-DM-S*` (spaces), `S-DM-NR*` (note references). _In-POC._
- [E-EDIT] **Note authoring and navigation.** Users create, edit, and navigate notes across spaces, labels, and views, with a markdown editor and app frame. Covers `S-UX-*` (`S-UX-MF*`, `S-UX-SA*`, `S-UX-ST*`, `S-UX-LT*`, `S-UX-NVT*`, `S-UX-NE*`, `S-UX-ERR`). _In-POC._
- [E-MUTATE] **Mutation semantics.** Move, rename, and delete semantics for notes and structural elements, including reference handling and attachment lifecycle. Covers `S-DM-MV*` (currently `[TBD]`). _Deferred._
- [E-AI] **AI-powered features.** Summarisation, visualisation, hypothesis generation, and semantic search over the knowledge base. No spec family yet; to be specified post-POC. _Deferred._

## Non-Functional Expectations

- [E-LOCAL-FIRST] **Local-first storage.** Content is stored locally as a folder-note structure with git versioning; the app is fully usable offline. Covers `S-ST-LS*` (local storage), `S-ST-DM*` (on-disk layout and indexes). _In-POC (desktop filesystem; web local storage)._
- [E-SYNC] **Cloud sync.** Optional sync to git-compatible cloud storage with conflict handling delegated to git. Covers `S-ST-CS*` (cloud storage), `S-ST-SYN*` (sync and conflict resolution) — both currently `[TBD]`. _Deferred._
- [E-CROSS-PLATFORM] **Shared cross-platform core.** A shared Rust core (CRUX) drives desktop, web, and mobile shells via platform-appropriate bindings, with per-platform configuration. Covers `S-ARCH-*` (architecture), `S-CFG-*` (configuration). _POC targets Desktop + Web only; mobile deferred._
- [E-STANDARDS] **Standards, readability, and performance.** Prefer standards and human-readable formats over custom solutions; performance and scalability matter. Cross-cutting constraint reflected in human-readable persistence (`S-DM-N*` markdown, `S-ST-DM*` JSON indexes) and the shared-core architecture (`S-ARCH-*`). _In-POC._
