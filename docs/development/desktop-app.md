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

**Tauri Commands:**

| Command | Returns | Description |
|---------|---------|-------------|
| `initialize` | `ViewModel` | Load all data from storage into the CRUX model |
| `get_view` | `ViewModel` | Get current view model without reloading |
| `get_storage_path` | `String` | Absolute path to the storage data directory |
| `create_note` | `ViewModel` | Create a new note |
| `update_note` | `ViewModel` | Update an existing note |
| `delete_note` | `ViewModel` | Delete a note |
| `create_topic` | `ViewModel` | Create a new topic |
| `update_topic` | `ViewModel` | Update an existing topic |
| `delete_topic` | `ViewModel` | Delete a topic |
| `add_topic_relation` | `ViewModel` | Add a relation between topics |
| `remove_topic_relation` | `ViewModel` | Remove a relation between topics |
