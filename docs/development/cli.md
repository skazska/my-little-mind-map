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
- install all JS dependencies:      `just install-js`
- install all deps: `just setup`

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
cd product/web-app && npx tsc --noEmit
cd product/desktop-app && npx tsc --noEmit
```

Docker Compose:

```bash
# Start all services (backend)
docker compose -f product/docker-compose.yml up -d

# View logs
docker compose -f product/docker-compose.yml logs -f backend

# Stop
docker compose -f product/docker-compose.yml down

# Rebuild after code changes
docker compose -f product/docker-compose.yml up -d --build
```

Backend without Docker:

```bash
just dev-backend
# Starts on http://localhost:3000
```
