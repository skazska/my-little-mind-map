# Developer Guide

## Infrastructure

[prerequisites](development/prerequisites.md)
[setup](development/setup.md)
[cli](development/cli.md)

### Future: Database

When a database is added, uncomment the `db` service in `product/docker-compose.yml`:

```yaml
db:
  image: postgres:17
  environment:
    POSTGRES_USER: ml_mindmap
    POSTGRES_PASSWORD: ml_mindmap_dev
    POSTGRES_DB: ml_mindmap
  ports:
    - "5432:5432"
```

Then set `DATABASE_URL` for the backend:

```bash
DATABASE_URL=postgres://mindmap:mindmap_dev@localhost:5432/mindmap cargo run -p backend-service
```

---

### Environment Variables

| Variable            | Default | Description                                              |
|---------------------|---------|----------------------------------------------------------|
| `RUST_LOG`          | `info`  | Log level for backend (`debug`, `info`, `warn`, `error`) |
| `DATABASE_URL`      | —       | Database connection string (future)                      |
| `PORT`              | `3000`  | Backend listen port (future, currently hardcoded)        |

Create a `.env` file in the project root for local overrides (loaded by `justfile`'s `set dotenv-load`):

```bash
# .env
RUST_LOG=debug
```

## Code

[shared core (CRUX)](development/shared-core-crux.md)
[backend service](development/backend-service.md)
[desktop app](development/desktop-app.md)
[web app](development/web-app.md)
[android app](development/android-app.md)
[iOS app](development/ios-app.md)

## code process

[git flow](development/git-flow.md)
[code standards](development/code-standards.md)
[testing](development/testing.md)

## Troubleshooting

### `cargo build --workspace` fails with pkg-config errors

Install Tauri system dependencies for your OS (see [Prerequisites](development/prerequisites.md#linux-ubuntudebian--tauri-system-dependencies)).

### `npm install` shows "npm warn"  messages

Usually safe to ignore unless they indicate a missing peer dependency. Run `npm install --legacy-peer-deps` if peer dependency conflicts arise.

### Tauri dev mode: blank window

Ensure the Vite dev server is running on port 1420. Check `product/desktop-app/src-tauri/tauri.conf.json` → `build.devUrl`.

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

### Running tests/E2E from a Copilot agent (VS Code terminal sandbox)

Agents run terminal commands inside the VS Code terminal sandbox (`chat.agent.sandbox.enabled`).
The sandbox applies seccomp + filesystem restrictions that interact badly with some tooling:

- **`just` recipes fail with `Read-only file system (os error 30)` at `/run/user/*/just/just-XXXX`.**
  `just` writes its recipe scripts to `XDG_RUNTIME_DIR` (`/run/user/<uid>`), which the sandbox
  makes read-only — overriding `TMPDIR` does **not** help. Allow that path in
  `.vscode/settings.json` → `chat.agent.sandbox.fileSystem.linux.allowWrite`:

  ```jsonc
  "allowWrite": [ "/run/user/*/just" ]
  ```

  Alternatively call the underlying npm script directly, e.g.
  `cd product/web-app && npm run test:e2e`.

- **Web/desktop E2E fail with `session not created: Chrome instance exited` (or `tauri-driver` crashes).**
  ChromeDriver/`tauri-driver` spawn browser processes that need namespace/GPU syscalls the
  sandbox seccomp profile blocks. `chat.agent.sandbox.allowUnsandboxedCommands: true` is **not**
  enough on its own — the child processes inherit the seccomp profile unless the *invoking*
  command itself is run unsandboxed. Run the E2E command with unsandboxed execution requested.
  Chrome itself is fine: `google-chrome --headless=new ... about:blank` prints
  `DevTools listening on ws://...` when run unsandboxed.

- **Stale processes block reruns.** Kill leftover Vite (port 3000) and ChromeDriver before each
  E2E run: `pkill -f 'vite' ; pkill -f 'chromedriver'`.

- **Rust tests** run fine sandboxed (`just test` / `cargo test --workspace`). If no default
  rustup toolchain is configured, use `rustup run stable cargo test --workspace`.
