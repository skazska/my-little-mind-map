### Desktop App (Tauri + React)

```bash
# Start in dev mode (hot-reload for frontend, auto-rebuild for Rust)
just dev-desktop

# Or manually:
cd desktop-app
pnpm install
pnpm tauri dev

# Build release:
just build-desktop
# Output: desktop-app/src-tauri/target/release/bundle/
```

**Dev URLs:**

- Vite dev server: `http://localhost:1420`
- Tauri window loads from the Vite dev server
