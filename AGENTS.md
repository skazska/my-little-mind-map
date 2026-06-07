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

- write specifications first
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

**Refer to documentation for how to do**:

- rich internal linking in project documentation.

**api-first**: design API before implementation.
**function over code deduplication**: duplication is acceptable only when the duplicated code serves genuinely distinct purposes likely to diverge; otherwise deduplicate. Same-purpose copies that share a change-reason are redundancy, not divergence.
**project flow**: see `project/` and `project/structure.md` for project flow guidelines, including planning, expectations gathering, decision making, and other project management practices.

- do not mix project flow with docs, specs, test cases, and code.
- refer expectations, specs, test cases, and code from project flow artifacts, not the opposite.
- plan changes, not calendar: no deadlines and time estimates, plan changes and iterations instead. Tasks are "units of change", sprints are "transitions between consistent states of the product".

**token economy**:

- concise, information-dense prose and diagrams.
- diagrams for complex relationships and flows.
- minimum duplication, referencing, layered detalizations.
- files focused, coherent, and short
- modularity and reuse

## Development

### Terms

- code items: function, method, param, type, variable, etc.
- code purpose: the reason why the code item exists, what it does, what it is for, etc.

### General Code Quality Principles

- simple and idiomatic
- readability and maintainability over cleverness
- community conventions and best practices
- lint and format
- Purpose-scoping and clarity:
  - no purpose-mixing, clear separation of concerns, single responsibility principle.
  - no purpose-splitting, code items/files should not be split into multiple code items/files without clear purpose separation.
- Clear purpose (code items and files):
  - name: short, descriptive, concise, purpose-aligned.
  - header comment: short, describe, purpose.
  - spec references: if directly impacted by a spec.
- no code errors
- no code warnings in main branches
- CI must pass before merge
- no dead code, no commented-out code without clear purpose and `TODO|FIXME`.

### Stack

**Just + App Specific CLIs**.
**Rust first**: for backend and business logic, with FFI, WASM, and CRUX for cross-platform support.
**Developer guides**: see `docs/development/`
**Testing**: unit for reusable or non-typing protected logic, integration and E2E for user flows and critical features.
**Git Flow**
**CI/CD**: GitHub Actions

## Types of Documentation

- Specifications (in other words `product definitions`) (`/specs`): expectations, specs, architecture, test-cases, acceptance-criteria.
- Product documentation (`/docs`):
  - developer guides, setup, code standards, test strategy/tooling.
  - product maintenance, deployment, monitoring, and operations.
  - user guides, FAQs, troubleshooting.
- Project flow artifacts (`/project`): planning, expectations gathering, decision making, and other project management practices.

## Specification notation and tooling

### Specification Layers

- Expectations - high-level business/user needs and goals. Codified, codes start with `E-`.
- Specs - technical specifications derived from expectations. Codified, codes start with `S-`.
- Test cases - testable conditions derived from specs. Codified, codes start with `TC-`.

### Notation principles

- One notation per purpose; all renderable from plain text with no extra infrastructure.
- Markdown first.
- Diagrams use [Mermaid](https://mermaid.js.org/) (renders natively in GitHub/VS Code); prefer Mermaid over hand-drawn ASCII for new diagrams.
- Notation per purpose:
  - prose / structured specs → Markdown.
  - lo-fi wireframes (expectations) → [wireMD](https://github.com/wireMD/spec) text sketches.
  - hi-fi UI layout wireframes → Mermaid block diagrams (`block-beta`).
  - interaction flows / state / sequences → Mermaid `flowchart` / `stateDiagram` / `sequenceDiagram`.
  - data model / relationships → Mermaid `erDiagram` / `classDiagram`.
  - architecture → Mermaid.
  - file / folder layouts → plain code-block tree (kept as text, not a diagram).
- Excluded: notations requiring rendering infrastructure or external tools (e.g. PlantUML/Salt, design-tool-only exports).
- Traceability is unaffected: `E-*`/`S-*`/`TC-*` codes stay in prose and diagram captions, not encoded in diagram syntax.

### Track spec coverage

- referencing:
  - expectation <- specs <- test cases <- tests.
  - specs <- code implementation
- reference by codes
- maintain traceability and internal consistency between expectations, specs, test cases, tests, and code.

## Repo structure

- `specs/`: specifications (expectations, specs, architecture, test-cases, acceptance-criteria)
- `docs/`: product documentation (developer guides)
- `product/`: product implementation
- `project/`: project flow artifacts

## Agents

Specialized review agents in `.github/agents/` (invoke to assert, not to implement):

- **SpecsQA**: specification clarity, consistency, completeness, traceability.
- **ImplementationQA**: code/test alignment, gaps, and traceability to specs/test cases.
- **CodeQA**: intrinsic code quality (readability, complexity, security, performance, duplication).
- **BehaviourQA**: runtime behaviour vs specs via tests/E2E/devtools.

Specialized implementation agents (invoke to implement, not to assert):

- **SpecsDev**: Authors and maintains product definitions — expectations, specs, and test cases — and fixes issues reported by SpecsQA. Clarifies missing information with the user, generates specs from expectations (and expectations from specs), and keeps specification aligned and traceable.
- **ImplementationDev**: Fixes runtime defects reported by BehaviourQA — functional misalignments, UX defects, data/integration issues, runtime errors and failure-path defects — then re-exercises the product to confirm the behaviour matches specs.
- **CodeDev**: Fixes intrinsic code-quality issues reported by CodeQA — readability, structure, complexity, duplication, idiomaticity, error handling, security, performance, dead code, naming, test-code quality and config hygiene — while preserving behaviour and spec alignment.
- **BehaviourDev**: Fixes runtime defects reported by BehaviourQA — functional misalignments, UX defects, data/integration issues, runtime errors and failure-path defects — then re-exercises the product to confirm the behaviour matches specs. Never masks failing tests.
