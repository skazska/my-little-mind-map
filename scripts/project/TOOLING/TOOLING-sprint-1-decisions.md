# TOOLING-sprint-1 Decisions

[TOOLING-sprint-1.md](../TOOLING-sprint-1.md)

## Single entry point per script

Each script has exactly one `src/index.ts` entry; subcommands are registered via `commander` sub-commands.

## Filesystem-based name resolution

`parseName` in `fs-utils.ts` resolves `MILESTONE[-SPRINT[-TASK]]` by probing the filesystem. No config file needed.

## Project root inferred from `__dirname`

`resolveProjectRoot()` walks 4 levels up from the compiled output location (`scripts/dist/plan/src/`) to find the workspace root. No environment variable or CLI flag required.

## Companion doc exclusion via suffix list

The `COMPANION_SUFFIXES` constant in `fs-utils.ts` lists known companion doc suffixes (`-requirements`, `-decisions`, `-results`, `-status`). Files matching these suffixes are excluded from task/sprint scanning. Adding new companion types requires updating this list.
