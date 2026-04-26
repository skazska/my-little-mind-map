# TOOLING-sprint-1: Plan CLI

[TOOLING.md](../TOOLING.md)

Implement the `just plan` CLI: a TypeScript CLI that automates all mechanical project-flow operations (scaffolding, status roll-up, section patching, validation).

## Goals

- Implement all 7 subcommands of the plan CLI
- Integrate with `just` task runner
- Document usage in `docs/development/cli.md` and spec in `docs/specs/plan-cli.md`

## Deliverables

- `scripts/plan/src/` — TypeScript sources for all commands
- `scripts/package.json`, `scripts/tsconfig.json`, `scripts/.gitignore`
- `justfile` recipes: `setup-scripts`, `build-scripts`, `plan`
- `docs/development/cli.md` updated with plan CLI section
- `scripts/README.md` — scripts developer guide
- `scripts/plan/SPEC.md` — plan CLI technical spec

## Requirements

- see [requirements](TOOLING-sprint-1-requirements.md)

## Decisions

- see [decisions](TOOLING-sprint-1-decisions.md)

## Tasks

- [TOOLING-sprint-1-task-1: implement plan CLI](TOOLING-sprint-1/TOOLING-sprint-1-task-1.md)

## Status

done

## Results and learnings

- see [status](TOOLING-sprint-1-status.md)
