# Specs

This section contains technical specifications for the MyLittleMindMap product. It includes detailed descriptions of the data model, storage, UX, configuration, and architecture that guide development and implementation.

## Unification

Most specifications are unified across all platforms; platform-specific details are documented in [architecture](architecture.md) and the platform sections under [development](../docs/development.md). The core logic and data model are shared across platforms, while UI and storage implementations may differ.

## Contents

- [Data Model](specs/data-model.md) — labels, views, spaces, notes, references, definitions, mutation semantics. Prefix: `S-DM-*`.
- [Storage](specs/storage.md) — local/cloud storage, sync, on-disk layout, indexes. Prefix: `S-ST-*`.
- [UX](specs/ux.md) — app frame, navigation, tabs, and the note-editor sub-spec. Prefix: `S-UX-*`.
- [Configuration](specs/config.md) — per-platform config locations and defaults. Prefix: `S-CFG-*`.
- [Architecture](specs/architecture.md) — summary; full details in [architecture.md](architecture.md). Prefix: `S-ARCH-*`.
- [Glossary](specs/glossary.md) — definitions of cross-cutting terms.

## Traceability

Spec IDs (e.g. `S-DM-N5`, `S-UX-NE4`) are stable identifiers. They MUST appear in:

- test names / test descriptions covering the spec,
- commit messages and PR descriptions that change behaviour governed by the spec,
- design notes and ADRs referencing the constraint.

The intended flow is: **spec → test cases → tests → code implementation** (see [AGENTS.md](../AGENTS.md) "document-test-code").

## Status

Items marked `[TBD]` are open spec questions. They are intentionally captured in-spec for now; tracking in `project/` was deferred during the POC and will resume once project-flow tracking is re-established.
