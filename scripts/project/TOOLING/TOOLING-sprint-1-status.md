# TOOLING-sprint-1 Status

[TOOLING-sprint-1.md](../TOOLING-sprint-1.md)

## Completed

- All 7 CLI subcommands implemented and passing integration tests
- `just setup-scripts`, `just build-scripts`, `just plan` recipes added to justfile
- `docs/development/cli.md` updated with full plan CLI section
- `scripts/README.md` created
- `scripts/plan/SPEC.md` created
- Project plan entries moved to `scripts/project/TOOLING/`

## Known issues / future work

- `collect`/`collectSection` helpers are duplicated in new-milestone, new-sprint, new-task — extract to shared utility
- `new-task` does not create a task subfolder (AGENTS.md prefers folder note structure)
- `validate` does not check anchor fragments in Markdown links
- No `rename` subcommand
