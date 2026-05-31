# AGENTS.md

## Project Overview

Multi-platform (mobile, desktop, web) + backend service advanced features.

Multi-app: desktop, web, mobile (iOS + Android).

Inspired by personal knowledge management, note-taking, and project management tools, but with a focus on text-centric approach and rich interlinking of artifacts and topics.

## Policies

**Prefer folder note filestructures**.
**Prefer Markdown and human-readable formats**.
**Prefer standards over custom solutions**.
**Performance and scalability matters**.
**Specs driven development**:

- write specs first
- specs must be codified
- spec codes must start with `S_`
- specs can only be written/modified by user or generated from expectations by agents with user interview and confirmation.
- specs must refer to expectations

**Test driven code**:

- write test cases based on specs before implementation.
- test-cases must be codified
- tets-codes must must start with `TC_`
- test-cases must refer specs
- implement tests before code.
- tests must refer test-cases.

**Specs->Tests->Code**:

- implement only what is in the specs
- code must refer to specs
- specs and test cases are the documentation for how to implement the code.

**Spec coverage**:

- all expectations must be covered by specs.
- all specs must be covered by test cases.
- all test cases must be covered by tests.
- all tests must be passed by code implementation.
- **Track spec coverage**:
- test cases reference spec IDs (e.g. `S-DM-N5`).
- test implementations reference test case IDs.
- code references spec IDs.

**Refer to documentation for how to do**:

- rich internal linking in documentation.

**api-first**: design API before implementation.
**function over code deduplication**: code may look duplicated but if it serves different purpose it may diverge in the future. TBD: move to coder agent
**plan changes, not calendar**: no deadlines and time estimates, plan changes and iterations instead. Tasks are "units of change", sprints are "transitions between consistent states of the product". (TBD: plan tokens)

## Repo structure

- `docs/`: documentation and guidelines for this project.
  - architecture: architecture overview (.md and folder)
  - development: development guidelines (.md and folder).
  - project-flow: project management guidelines (.md and folder).
  - specs: specifications (.md and folder)
  - tests: testing guidelines and test cases (.md and folder)
- `product/`: product implementation

## Product Key Expectations

- Text-centric: markdown notes as source of truth, other artifacts referenced in text, metadata derived from content.
- Local-first with cloud sync capability: local storage, git versioning and sync.
- Backend service for advanced features.
- Rich interlinking, notes tree, topics tree, topic relations.
- AI-powered features: summarisation, visualisation, hypothesis generation, search, etc.

## Development Stack

**Just + App Specific CLIs**.
**Rust first**: for backend and business logic, with FFI, WASM, and CRUX for cross-platform support.
**Developer guides**: see `docs/development/`
**Testing**: unit for reusable or non-typing protected logic, integration and E2E for user flows and critical features.
**Git Flow**: See `docs/development/git-flow.md`
**CI/CD**: GitHub Actions

## MCP services

io.github.github/github-mcp-server
io.github.ChromeDevTools/chrome-devtools-mcp
