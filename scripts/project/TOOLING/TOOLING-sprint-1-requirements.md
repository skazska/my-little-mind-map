# TOOLING-sprint-1 Requirements

[TOOLING-sprint-1.md](../TOOLING-sprint-1.md)

## Plan CLI subcommands

- `new-milestone <M> <description>` — scaffold milestone file + companion docs, append to PLAN.md
- `new-sprint <M> <S> <description>` — scaffold sprint file + companion docs, append sprint entry to milestone
- `new-task <M> <S> <T> <description>` — scaffold task file, append task entry to sprint
- `update-status <name> <status>` — update the `## Status` section of the named artifact
- `rollup [M] [S]` — compute and write status roll-up from children
- `patch <name> --section <S> --add <item>` — append an item to a named section
- `validate [M]` — check links, naming, status validity, and roll-up consistency

## Toolchain

- TypeScript 7 (`@typescript/native-preview`) for type-safe source; compiled to CommonJS
- `commander` v14 for argument parsing
- No runtime transpiler; compiled artefacts committed to `scripts/dist/` (gitignored)

## Integration

- `just setup-scripts` installs deps
- `just build-scripts` compiles sources
- `just plan *args:` invokes compiled entry point
- `just setup` runs all three automatically
