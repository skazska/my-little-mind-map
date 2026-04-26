# TOOLING-sprint-1-task-1: Implement Plan CLI

[TOOLING.md](../../TOOLING.md) | [TOOLING-sprint-1.md](../TOOLING-sprint-1.md)

Implement a TypeScript CLI at `scripts/plan/` that automates all mechanical operations from the `manage-project-flow-data` skill: scaffolding, status roll-up, section patching, and validation. Compile via TypeScript 7 native Go (`tsgo`). Invoke via `just plan <command>`.

## Goals

- Automate all mechanical project-flow operations so they no longer require manual file creation
- Enforce canonical naming and file structure from `docs/project-flow.md`
- Provide a reliable build chain: `just setup-scripts` → `just build-scripts` → `just plan`

## Requirements

- 7 subcommands: `new-milestone`, `new-sprint`, `new-task`, `update-status`, `rollup`, `patch`, `validate`
- Repeatable options: `--goal`, `--requirement`, `--blocker`, `--open-question`, `--deliverable`, `--design-note`, `--acceptance-criterion`, `--section "Name=item"`
- Exit 0 on success, exit 1 on any error or validation failure
- All file writes idempotent where possible; error on overwrite for scaffold commands

## Deliverables

- `scripts/plan/src/fs-utils.ts` — file I/O and markdown mutation utilities
- `scripts/plan/src/templates.ts` — milestone/sprint/task content generators
- `scripts/plan/src/status.ts` — status type, roll-up algorithm
- `scripts/plan/src/validate.ts` — link, naming, status, and roll-up validation
- `scripts/plan/src/index.ts` — commander entry point
- `scripts/README.md` — scripts developer guide
- `scripts/plan/SPEC.md` — plan CLI technical spec
- `scripts/README.md` — scripts developer guide
- `scripts/plan/SPEC.md` — plan CLI technical spec

## Design notes

- `resolveProjectRoot()` walks 4 levels up from `__dirname` (compiled path: `scripts/dist/plan/src/`)
- `parseName(name)` resolves `M[-S[-T]]` by filesystem presence to handle names with hyphens
- `COMPANION_SUFFIXES` constant drives companion doc exclusion in sprint/task scanning
- tsgo constraint: omit `moduleResolution` field; use only `module: "CommonJS"` + `"types": ["node"]`

## Acceptance criteria

- `just plan new-milestone TEST "test milestone"` creates `project/TEST.md` and companion docs and appends to `PLAN.md`
- `just plan new-sprint TEST sprint-1 "test sprint"` creates sprint file + companion docs + appends entry to `TEST.md`
- `just plan new-task TEST sprint-1 task-1 "test task"` creates task file + appends entry to sprint file
- `just plan update-status TEST-sprint-1-task-1 done` sets task status to `done`
- `just plan rollup TEST sprint-1` computes roll-up and writes sprint status
- `just plan rollup TEST` computes roll-up for all sprints and writes milestone status
- `just plan validate` exits 0 with no output on a clean project
- `just plan validate` exits 1 and prints violations if any broken links or invalid statuses exist

## Status

done
