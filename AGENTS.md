# AGENTS.md

## Project Overview

Multi-platform (mobile, desktop, web) + backend service advanced features.

Multi-app: desktop, web, mobile (iOS + Android).

Inspired by personal knowledge management, note-taking, and project management tools, but with a focus on text-centric approach and rich interlinking of artifacts and topics.

## Policies

- **Prefer folder note filestructures**.
- **Prefer Markdown and human-readable formats**.
- **Prefer standards over custom solutions**: to ensure compatibility and reduce maintenance.
- **performance and scalability matters**.
- **document-test-code**:
  - refer to documentation for guidelines and standards,
  - document what going to do,
  - rich internal linking in documentation,
  - specs -> test cases -> test implementation -> code implementation.
- **api-first**: design API before implementation.
- **function over code deduplication**: code may look duplicated but if it serves different purpose it may diverge in the future. TBD: move to coder agent
- **plan changes, not calendar**: no deadlines and time estimates, plan changes and iterations instead. Tasks are "units of change", sprints are "transitions between consistent states of the product". (TBD: plan tokens)

## Repo structure

- `docs/`: documentation and guidelines for this project.
  - architecture: architecture overview (.md and folder)
  - development: development guidelines (.md and folder).
  - project-flow: project management guidelines (.md and folder).
  - specs: specifications (.md and folder)
  - tests: testing guidelines and test cases (.md and folder)
- `project/`: project-management
  - IDEA.md: initial project idea, vision, goals
  - PLAN.md: high-level project plan and roadmap
  - folders for each plan milestone
    - status (.md and folder)
    - results (.md and folder)
    - requirements (.md and folder)
    - decisions (.md and folder)
    - phases/sprints
      - tasks, issues, etc.
- `product/`: product implementation

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
