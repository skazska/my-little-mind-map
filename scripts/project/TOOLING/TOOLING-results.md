# TOOLING Results and Learnings

[TOOLING.md](../TOOLING.md)

## Plan CLI (sprint-1)

- tsgo rejects `moduleResolution: "node10"` and `"bundler"` — omit the field when using `module: "CommonJS"`.
- tsgo does not auto-discover Node globals; `@types/node` must be added as a dev dep and listed under `"types"` in tsconfig.
- tsgo preserves the full `rootDir`-relative output path, so output for `scripts/plan/src/index.ts` lands at `scripts/dist/plan/src/index.js`, not `scripts/dist/plan/index.js`.
- Markdown template building with array `.join('')` loses blank lines between sections; prefer imperative string concatenation.
- `collect`/`collectSection` helpers are duplicated across command files — future sprint should extract them to a shared utility in `scripts/plan/src/`.
- No unit tests for pure functions (roll-up, template, section-patch algorithms) — future sprint should add a test runner.
- `new-task` does not create a task subfolder; tasks with sub-artifacts will need a follow-up improvement.
