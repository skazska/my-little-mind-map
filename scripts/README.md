# scripts

Node-based developer scripts for the my-little-mind-map project. Each script is a sub-project under its own subfolder, sharing a single `package.json` and TypeScript compiler config. Compiled to `scripts/dist/` with TypeScript 7 (`tsgo`). Invoked via `just` recipes — no runtime transpiler.

## Sub-projects

| Script | Description | Docs |
|---|---|---|
| [plan](plan/) | Project-flow automation CLI | [plan/README.md](plan/README.md) · [plan/SPEC.md](plan/SPEC.md) |

## Setup and build

`npm install`
`npm run build`
`npm run test`

All three run automatically as part of `just setup`.

## Structure

```
scripts/
  package.json          # shared deps for all scripts
  tsconfig.json         # compiles all scripts → dist/
  .gitignore            # ignores dist/ and node_modules/
  plan/                 # plan CLI sub-project
    README.md
    SPEC.md
    src/
    tests/
  project/              # project tracking for this sub-project
    TOOLING.md
    TOOLING/
  dist/                 # compiled output (git-ignored)
```

## Adding a new script

1. Create `scripts/{name}/src/index.ts` as the entry point.
2. Add to `include` in `scripts/tsconfig.json`:

   ```json
   "include": ["plan/src/**/*.ts", "{name}/src/**/*.ts", "{name}/tests/**/*.ts"]
   ```

3. Compiled output lands at `scripts/dist/{name}/src/index.js`.
4. Add `just` recipes to the root `justfile`:

   ```
   {name} *args:
       node scripts/dist/{name}/src/index.js {{args}}
   ```

5. Add a row to the **Sub-projects** table above.
6. Add a brief entry to `docs/development/scripts.md`.

## Dependency management

All scripts share `scripts/package.json`. There are no per-script `package.json` files. Add shared runtime deps (used by ≥2 scripts) as `dependencies`; script-specific ones go there too. `@typescript/native-preview` is the compiler; `@types/node` provides Node stdlib types.

## TypeScript toolchain

Uses `@typescript/native-preview` (TypeScript 7, native Go compiler — `tsgo`). Key constraints:

- Omit `moduleResolution` field when `"module": "CommonJS"` (tsgo rejects `"node10"` / `"bundler"`).
- Compiled output preserves `rootDir`-relative path: `plan/src/index.ts` → `dist/plan/src/index.js`.
- `@types/node` must be declared under `"types"` in tsconfig; tsgo does not auto-discover Node globals.

To switch to classic TypeScript: replace `@typescript/native-preview` with `typescript` and change `tsgo` → `tsc` in the build script. No source changes required.

## Project tracking

Internal planning data for this sub-project lives under [project/](project/) — not in the root `project/` directory.
