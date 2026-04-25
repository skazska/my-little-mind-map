# AGENTS.md

## Project Overview

Multi-platform (mobile, desktop, web) + backend service for collecting, storing, and managing context around topics through interconnected artifacts.

Inspired by personal knowledge management, note-taking, and project management tools, but with a focus on text-centric approach and rich interlinking of artifacts and topics.

## Policies

- **Prefer folder note filestructures**.
- **Prefer Markdown and human-readable formats**.
- **Prefer standards over custom solutions**: to ensure compatibility and reduce maintenance.
- **performance and scalability matters**.
- **documentation-first**:
  - refer to guidelines,
  - document what going to do,
  - rich internal linking in documentation,
  - specs then implementation.
- **plan changes, not calendar**: no deadlines and time estimates, plan changes and iterations instead. Tasks are "units of change", sprints are "transitions between consistent states of the product". (TBD: plan tokens)
- **tests-as-specs**: treat tests as specifications. TBD: move to coder agent.
- **api-first**: design API before implementation. TBD: move to coder agent.
- **function over code deduplication**: code may look duplicated but if it serves different purpose it may diverge in the future. TBD: move to coder agent

## Repo structure

- `docs/`: documentation and guidelines
  - architecture: architecture overview
  - development: development guidelines, setup, code standards, git flow, etc.
  - filestructure: project files and folders
  - operation: operational guide (deployment, monitoring, etc.)
  - project-flow: project management guidelines (planning, requirements, decisions, etc.)
  - release: release guidelines
  - specs: specifications
  - user: user guides and manuals
- `project/`: project-management
  - IDEA: initial project idea, vision, goals
  - PLAN: high-level project plan and roadmap
  - folders for each plan milestone
    - status
    - results and learnings
    - requirements
    - decisions
    - phases/sprints
      - tasks, issues, etc.
- `product/`: product implementation
  TBD: move backend-service, desktop-app, mobile-app, shared, shared_types, test, web-app and necessary infrastructure files here.

## Product Key Expectations

- Text-centric: markdown notes as source of truth, other artifacts referenced in text, metadata derived from content.
- Local-first with cloud sync capability: local storage, git versioning and sync.
- Backend service for advanced features.
- Rich interlinking, notes tree, topics tree, topic relations.
- AI-powered features: summarisation, visualisation, hypothesis generation, search, etc.

## Development Stack

- **Just + App Specific CLIs**.
- **Rust first**: for backend and business logic, with FFI, WASM, and CRUX for cross-platform support.
- **Developer guides**: see `docs/development/`
- **Testing**: unit for reusable or non-typing protected logic, integration and E2E for user flows and critical features.
- **Git Flow**: See `docs/development/git-flow.md`
- **CI/CD**: GitHub Actions

## MCP services

io.github.github/github-mcp-server
io.github.ChromeDevTools/chrome-devtools-mcp
