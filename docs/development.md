# Developer Guide

## Infrastructure

[prerequisites](development/prerequisites.md)
[setup](development/setup.md)
[cli](development/cli.md)

### Future: Database

When a database is added, uncomment the `db` service in `docker-compose.yml`:

```yaml
db:
  image: postgres:17
  environment:
    POSTGRES_USER: mindmap
    POSTGRES_PASSWORD: mindmap_dev
    POSTGRES_DB: mindmap
  ports:
    - "5432:5432"
```

Then set `DATABASE_URL` for the backend:

```bash
DATABASE_URL=postgres://mindmap:mindmap_dev@localhost:5432/mindmap cargo run -p backend-service
```

---

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RUST_LOG` | `info` | Log level for backend (`debug`, `info`, `warn`, `error`) |
| `DATABASE_URL` | — | Database connection string (future) |
| `PORT` | `3000` | Backend listen port (future, currently hardcoded) |

Create a `.env` file in the project root for local overrides (loaded by `justfile`'s `set dotenv-load`):

```bash
# .env
RUST_LOG=debug
```

## code process

[git flow](development/git-flow.md)
[code standards](development/code-standards.md)
[documentation](development/documentation.md)

## Code

[shared core (CRUX)](development/shared-core-crux.md)
[backend service](development/backend-service.md)
[desktop app](development/desktop-app.md)
[web app](development/web-app.md)
[android app](development/android-app.md)
[iOS app](development/ios-app.md)

---

## Troubleshooting

### `cargo build --workspace` fails with pkg-config errors

Install Tauri system dependencies for your OS (see [Prerequisites](development/prerequisites.md#linux-ubuntudebian--tauri-system-dependencies)).

### `npm install` shows "npm warn"  messages

Usually safe to ignore unless they indicate a missing peer dependency. Run `npm install --legacy-peer-deps` if peer dependency conflicts arise.

### Tauri dev mode: blank window

Ensure the Vite dev server is running on port 1420. Check `desktop-app/src-tauri/tauri.conf.json` → `build.devUrl`.

### Rust analyzer slow in VS Code

Add to `.vscode/settings.json`:

```json
{
  "rust-analyzer.check.command": "clippy",
  "rust-analyzer.cargo.buildScripts.enable": true
}
```

### `nvm` / `node` not found after install

```bash
# If installed via nvm, ensure it's in PATH:
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

```
