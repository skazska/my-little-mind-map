# plan CLI — Technical Spec

Developer guide: [../README.md](../README.md)
Usage reference: [README.md](README.md)
Root usage entry: [docs/development/cli.md](../../docs/development/cli.md#project-flow-cli-just-plan)
Source: [src/](src/)
Project tracking: [../project/TOOLING/TOOLING-sprint-1/TOOLING-sprint-1-task-1.md](../project/TOOLING/TOOLING-sprint-1/TOOLING-sprint-1-task-1.md)

## Purpose

`just plan` is a project-flow automation CLI. It handles all **mechanical** operations on `project/` documentation: scaffolding files from templates, updating status fields, computing status roll-ups, patching section contents, and validating consistency. Content authoring (writing goals, requirements prose, design decisions) remains the responsibility of the developer or AI agent.

The CLI enforces the canonical naming and file structure defined in [docs/project-flow.md](../../docs/project-flow.md) and [.github/skills/manage-project-flow-data/SKILL.md](../../.github/skills/manage-project-flow-data/SKILL.md).

## Naming Conventions

The CLI enforces these canonical paths:

| Artifact | Path |
|---|---|
| Milestone summary | `project/{M}.md` |
| Milestone folder | `project/{M}/` |
| Sprint summary | `project/{M}/{M}-{S}.md` |
| Sprint folder | `project/{M}/{M}-{S}/` |
| Task file | `project/{M}/{M}-{S}/{M}-{S}-{T}.md` |

Companion docs created alongside milestone files:

- `project/{M}/{M}-requirements.md`
- `project/{M}/{M}-decisions.md`
- `project/{M}/{M}-results.md`

Companion docs created alongside sprint files:

- `project/{M}/{M}-{S}/{M}-{S}-requirements.md`
- `project/{M}/{M}-{S}/{M}-{S}-decisions.md`
- `project/{M}/{M}-{S}/{M}-{S}-status.md`

Names (`{M}`, `{S}`, `{T}`) may contain hyphens. The CLI uses filesystem presence to resolve ambiguity when parsing `MILESTONE[-SPRINT[-TASK]]` composite arguments.

## File Format

All files are Markdown. The CLI reads and writes them using section detection based on `## Heading` patterns. The assumed document structure is:

```
# {name}

{breadcrumb links}

{description}

## Goals
- ...

## Blockers        ← optional
- ...

## Requirements
- ...

## Open questions
- ...

## Decisions       ← milestones and sprints only
- ...

## Deliverables    ← sprints and tasks only, optional
- ...

## Design notes    ← tasks only, optional
- ...

## Acceptance criteria  ← tasks only, optional
- ...

## {CustomSection} ← any additional section, optional
- ...

## Status
{status value}

## Results and learnings  ← optional
- ...
```

Section detection is **case-insensitive** for the `patch` command. Unknown sections are created on demand (inserted before `## Status`).

## Status Vocabulary

Valid status values:

| Value | Meaning |
|---|---|
| `planned` | Not yet started |
| `in-progress` | Active work underway |
| `blocked` | Cannot proceed, waiting on dependency |
| `done` | Complete |

Any other value is rejected by `update-status` and flagged by `validate`.

## Roll-up Algorithm

Defined in [src/status.ts](src/status.ts):

1. If any child is `blocked` → parent is `blocked`
2. Else if any child is `in-progress` → parent is `in-progress`
3. Else if all children are `done` → parent is `done`
4. Else → parent is `planned`

Children with no status value (empty string) are treated as `planned` in the roll-up.

The `rollup` command writes the computed status to the parent file. It does **not** write to `project/PLAN.md` — that file is updated manually or by `new-milestone`.

## Commands

### `new-milestone <M> <description>`

Creates:

- `project/{M}.md` (from template)
- `project/{M}/` directory
- `project/{M}/{M}-requirements.md`
- `project/{M}/{M}-decisions.md`
- `project/{M}/{M}-results.md`

Appends a prose entry to `project/PLAN.md` if `## {M}` is not already present.

Errors if `project/{M}.md` already exists (no overwrite).

Options:

- `--goal <item>` — repeatable; adds item to `## Goals`
- `--requirement <item>` — repeatable; adds item to `## Requirements`
- `--blocker <item>` — repeatable; adds item to `## Blockers`
- `--open-question <item>` — repeatable; adds item to `## Open questions`
- `--section "Name=item text"` — repeatable; adds item to a custom section

---

### `new-sprint <M> <S> <description>`

Requires `project/{M}.md` to exist. Creates:

- `project/{M}/{M}-{S}.md` (from template)
- `project/{M}/{M}-{S}/` directory
- Three companion docs (requirements, decisions, status)

Appends a linked entry to the `## Sprints` section of `project/{M}.md` (creates the section if absent).

Errors if `project/{M}/{M}-{S}.md` already exists.

Options: same as `new-milestone` plus `--deliverable <item>`.

---

### `new-task <M> <S> <T> <description>`

Requires `project/{M}/{M}-{S}.md` to exist. Creates:

- `project/{M}/{M}-{S}/{M}-{S}-{T}.md` (from template)

Appends a linked entry to the `## Tasks` section of the sprint file.

Errors if the task file already exists.

Options: same as `new-sprint` plus `--design-note <item>` and `--acceptance-criterion <item>`.

---

### `update-status <name> <status>`

`<name>` is parsed as `MILESTONE[-SPRINT[-TASK]]` using filesystem resolution.

Finds the corresponding `.md` file and replaces the content under `## Status` with the given value. Appends `## Status` section if not present.

Accepts only: `planned`, `in-progress`, `blocked`, `done`. Exits 1 otherwise.

---

### `rollup [M] [S]`

| Arguments | Behavior |
|---|---|
| none | Roll up all discovered milestones |
| `<M>` | Roll up all sprints in `{M}`, then `{M}` itself |
| `<M> <S>` | Roll up tasks in sprint `{M}-{S}`, write result to sprint file only |

Milestones are discovered by scanning `project/*.md` (excluding `PLAN.md` and `IDEA.md`).
Sprint files are discovered by scanning `project/{M}/*.md` (excluding companion docs).
Task files are discovered by scanning `project/{M}/{M}-{S}/*.md` (excluding companion docs).

Prints each updated item and its computed status to stdout.

---

### `patch <name> --section <S> --add <item> [--link <url>]`

Appends a bullet item to the named section in the target file. Section matched case-insensitively against `## {S}` headings.

If the section does not exist, it is created immediately before `## Status`.

With `--link <url>`: formats the item as `- [CODE](url): rest` where `CODE` is the text before the first `:` in `<item>`. Used for blocker references with links to detail files.

---

### `validate [M]`

Validates the project documentation for the given milestone (or all milestones if omitted).

Checks:

1. **Broken links** — all relative Markdown links `[text](path)` resolve to existing files (anchors not checked)
2. **Non-canonical filenames** — files in `project/{M}/` must start with `{M}-`; files in sprint dirs must start with `{M}-{S}-`
3. **Invalid status values** — `## Status` content must be one of the four valid values
4. **Roll-up consistency** — computed roll-up from children must match the parent file's current status

Prints each violation as `{file}:{line}: {message}`. Exits 0 if clean, 1 if any violations found.

## Exit Codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | User error (invalid args, file not found, already exists) or validation failure |

## Constraints and Known Limitations

- **Canonical naming only**: the CLI will not read or update legacy POC phase files (e.g. `POC_N_status.md`, `POC-phase-N/`).
- **PLAN.md append only**: `new-milestone` appends prose to `PLAN.md` matching the existing free-form style; it does not parse or reformat existing content.
- **No task folder creation**: `new-task` creates only the task `.md` file, not a `{M}-{S}-{T}/` subfolder.
- **Anchor validation skipped**: link validation checks file existence only, not that the `#anchor` fragment exists within the target file.
- **parseName relies on filesystem**: `update-status` and `patch` resolve `M[-S[-T]]` by checking which files/dirs exist. The name must uniquely identify an existing artifact.
- **No rename support**: the `rename` operation described in the skill is not implemented; renaming requires manual file moves and link updates.

## Source Map

| File | Responsibility |
|---|---|
| [src/index.ts](src/index.ts) | commander entry point; registers all 7 commands |
| [src/fs-utils.ts](src/fs-utils.ts) | file I/O, path helpers, markdown section mutation |
| [src/templates.ts](src/templates.ts) | Markdown content generators for all file types |
| [src/status.ts](src/status.ts) | `Status` type, `rollupStatuses()`, sprint/milestone roll-up |
| [src/validate.ts](src/validate.ts) | link, naming, status, and roll-up validation logic |
| [src/commands/new-milestone.ts](src/commands/new-milestone.ts) | `new-milestone` subcommand |
| [src/commands/new-sprint.ts](src/commands/new-sprint.ts) | `new-sprint` subcommand |
| [src/commands/new-task.ts](src/commands/new-task.ts) | `new-task` subcommand |
| [src/commands/update-status.ts](src/commands/update-status.ts) | `update-status` subcommand |
| [src/commands/rollup.ts](src/commands/rollup.ts) | `rollup` subcommand |
| [src/commands/patch.ts](src/commands/patch.ts) | `patch` subcommand |
| [src/commands/validate.ts](src/commands/validate.ts) | `validate` subcommand |

## Dependencies

| Package | Role |
|---|---|
| `commander` | CLI argument parsing |
| `@typescript/native-preview` | TypeScript 7 compiler (dev) |
| `@types/node` | Node stdlib types (dev) |
| Node stdlib (`node:fs`, `node:path`) | File I/O |
