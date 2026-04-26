# TOOLING Decisions

[TOOLING.md](../TOOLING.md)

## TypeScript 7 + tsgo

Use `@typescript/native-preview` (TypeScript 7, native Go compiler) as the build-time compiler.
Chosen for: native speed, modern language features, no separate install of `ts-node` or `tsx`.
Trade-off: some tsconfig fields (`moduleResolution: "node10"`, `"bundler"`) are rejected; omit `moduleResolution` when using `module: "CommonJS"`.

## commander

Use `commander` v14 for CLI argument parsing.
Chosen for: ergonomic API, mature ecosystem, no runtime overhead.

## Shared package.json under scripts/

All Node scripts share a single `scripts/package.json`.
Rationale: avoids maintaining separate lockfiles per script; scripts are not independently published.

## CLI over YAML/config

Subcommand-based CLI (not YAML config files) for project-flow automation.
Rationale: composable via shell, debuggable, works with `just`, no extra parser needed.
