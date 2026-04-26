# TOOLING Requirements

[TOOLING.md](../TOOLING.md)

## Plan CLI

- All mechanical project-flow operations available as CLI subcommands
- Invoked via `just plan <command>` using the `justfile` task runner
- Written in TypeScript, compiled with TypeScript 7 native Go compiler (`tsgo`)
- No runtime transpilation; compiled to CommonJS
- Subcommands: `new-milestone`, `new-sprint`, `new-task`, `update-status`, `rollup`, `patch`, `validate`
- Exit code 0 on success, 1 on error or validation failure
