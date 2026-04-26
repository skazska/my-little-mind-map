# CLI

- list all recipes:                 `just`
- build all Rust crates:            `just build`
- run all Rust tests:               `just test`
- clippy with warnings as errors:   `just lint`
- format all Rust code:             `just fmt`
- check formatting (CI-safe):       `just fmt-check`
- fmt-check + lint + test:          `just ci`
- run backend service:              `just dev-backend`
- run desktop app (Tauri dev mode): `just dev-desktop`
- run web app (Vite dev server):    `just dev-web`
- build desktop release:            `just build-desktop`
- build web production bundle:      `just build-web`
- install all JS dependencies:      `just setup`
- install scripts dependencies:     `just setup-scripts`
- build Node scripts:               `just build-scripts`
- project-flow plan CLI:            `just plan <command>`

## Project flow CLI (`just plan`)

`just plan` wraps `scripts/dist/plan/src/index.js`. Run `just build-scripts` first (included in `just setup`).

```bash
# Scaffold
just plan new-milestone POC2 "Desktop + Web app reboot"
just plan new-sprint POC2 sprint-1 "Core note editing"
just plan new-task POC2 sprint-1 task-1 "Markdown editor"

# With initial content
just plan new-task POC2 sprint-1 task-2 "Topic tree" \
  --goal "GOAL_1: Show topic hierarchy" \
  --requirement "REQ_1: Must support nesting" \
  --acceptance-criterion "AC_1: Topics render as tree"

# Custom / blocker sections
just plan patch POC2-sprint-1-task-1 --section Blockers \
  --add "BLK_1: Waiting on design spec" \
  --link "../POC2-sprint-1-blockers.md#BLK_1"

just plan patch POC2-sprint-1 --section "Implementation notes" \
  --add "IN_1: Use streaming file writes"

# Status
just plan update-status POC2-sprint-1-task-1 done
just plan rollup POC2          # recompute sprint + milestone statuses
just plan rollup               # recompute all milestones

# Validation
just plan validate             # all milestones
just plan validate POC2        # single milestone
```

### Commands reference

| Command | Description |
|---|---|
| `new-milestone <M> <desc>` | Create milestone file + companion docs, append to PLAN.md |
| `new-sprint <M> <S> <desc>` | Create sprint file + companion docs, append to milestone |
| `new-task <M> <S> <T> <desc>` | Create task file, append to sprint |
| `update-status <name> <status>` | Set status in milestone/sprint/task file |
| `rollup [M] [S]` | Recompute + write statuses bottom-up |
| `patch <name> --section <S> --add <item> [--link <url>]` | Append bullet to any section |
| `validate [M]` | Check links, naming, status vocabulary + roll-up consistency |

All `new-*` commands accept repeatable flags: `--goal`, `--requirement`, `--blocker`, `--open-question`, `--section "Name=item text"`.

## Quick Reference

```bash
just test                    # all Rust tests
cargo test -p shared         # shared core only
cargo test -p backend-service # backend only
```

```bash
just lint        # clippy, warnings = errors
just fmt-check   # formatting check
```

```bash
just ci   # runs: fmt-check → lint → test
```

Frontend type checking:

```bash
cd web-app && npx tsc --noEmit
cd desktop-app && npx tsc --noEmit
```

Docker Compose:

```bash
# Start all services (backend)
docker compose up -d

# View logs
docker compose logs -f backend

# Stop
docker compose down

# Rebuild after code changes
docker compose up -d --build
```

Backend without Docker:

```bash
just dev-backend
# Starts on http://localhost:3000
```
