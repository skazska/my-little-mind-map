# AGENTS.md

## Project Overview

Multi-platform (mobile, desktop, web) + backend service advanced features.

Multi-app: desktop, web, mobile (iOS + Android).

Inspired by personal knowledge management, note-taking, and project management tools, but with a focus on text-centric approach and rich interlinking of artifacts and topics.

## Policies

**Prefer folder-notes directory structure to organize content detalization**:

- structure-folders can group by content type, for example, `docs/`, `specs/`, `tests/`, `src/`, `src/lib/`, `src/components/`.
- note-folders can contain details for a specific artifact, for example:
  - `project/milestones`:
    - `milestone-1.md`: summary of the milestone.
    - `milestone-1/`: note-folder for the milestone-1.md different artifacts, and even own `structure folder`s inside note-folder like `project/milestones/milestone-1/tasks/`.
  - `src/modules`:
    - `module-1.js`: main file for the module.
    - `module-1/`: note-folder for the module-1 incapsulated files and even own `structure folder`s inside note-folder like `src/modules/module-1/services/`.

**Prefer Markdown and human-readable formats**.
**Prefer standards over custom solutions**.
**Performance and scalability matters**.
**Specs driven development**:

- write specs first
- specs must be codified
- spec codes must start with `S-`
- specs can only be written/modified by user or generated from expectations by agents with user interview and confirmation.

**Test driven code**:

- write test cases based on specs before implementation.
- test-cases must be codified
- test-codes must must start with `TC-`
- implement tests before code.

**Specs->Tests->Code**:

- implementation should follow specs
- code should refer to specs
- specs and test cases are the documentation for how to implement the code.

**Spec coverage**:

- expectations must be covered by specs.
- specs must be covered by test cases.
- test cases must be covered by tests.
- tests must be passed by code implementation.

**Track spec coverage**:

- referencing:
  - expectation <- specs <- test cases <- tests
  - specs <- code implementation
- reference by codes
- maintain traceability and internal consistency between expectations, specs, test cases, tests, and code.

**Refer to documentation for how to do**:

- rich internal linking in documentation.

**api-first**: design API before implementation.
**function over code deduplication**: duplication is acceptable only when the duplicated code serves genuinely distinct purposes likely to diverge; otherwise deduplicate. Same-purpose copies that share a change-reason are redundancy, not divergence.
**project flow**: see `project/` and `project/structure.md` for project flow guidelines, including planning, expectations gathering, decision making, and other project management practices.

- do not mix project flow with docs, specs, test cases, and code.
- refer expectations, specs, test cases, and code from project flow artifacts, not the opposite.
- plan changes, not calendar: no deadlines and time estimates, plan changes and iterations instead. Tasks are "units of change", sprints are "transitions between consistent states of the product".

## Repo structure

- `docs/`: documentation and guidelines for this project.
  - architecture: architecture overview (.md and folder)
  - development: development guidelines (.md and folder).
  - specs: specifications (.md and folder)
  - tests: testing guidelines and test cases (.md and folder)
- `product/`: product implementation
- `project/`: project management documentation and artifacts

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
**Git Flow**
**CI/CD**: GitHub Actions

## QA agents

Specialized review agents in `.github/agents/` (invoke to assert, not to implement):

- **SpecsQA**: documentation clarity, consistency, completeness, traceability.
- **ImplementationQA**: code/test alignment, gaps, and traceability to specs/test cases.
- **CodeQA**: intrinsic code quality (readability, complexity, security, performance, duplication).
- **BehaviourQA**: runtime behaviour vs specs via tests/E2E/devtools.

Specialized implementation agents (invoke to implement, not to assert):

- **SpecsDev**: Authors and maintains product documentation — expectations, specs, and test cases — and fixes issues reported by SpecsQA. Clarifies missing information with the user, generates specs from expectations (and expectations from specs), and keeps documentation aligned and traceable.
- **ImplementationDev**: Fixes runtime defects reported by BehaviourQA — functional misalignments, UX defects, data/integration issues, runtime errors and failure-path defects — then re-exercises the product to confirm the behaviour matches specs.
- **CodeDev**: Fixes intrinsic code-quality issues reported by CodeQA — readability, structure, complexity, duplication, idiomaticity, error handling, security, performance, dead code, naming, test-code quality and config hygiene — while preserving behaviour and spec alignment.
- **BehaviourDev**: Fixes runtime defects reported by BehaviourQA — functional misalignments, UX defects, data/integration issues, runtime errors and failure-path defects — then re-exercises the product to confirm the behaviour matches specs. Never masks failing tests.
