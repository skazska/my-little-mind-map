# Configuration Spec

Spec IDs in this document use the `S-CFG-*` prefix.

Satisfies: [E-CROSS-PLATFORM](../expectations.md) (`S-CFG-*`).

- [S-CFG-1] Path to data folder and sync settings are platform-specific and stored in app settings (outside the data folder):
  - **Desktop** — OS-conventional config location:
    - Linux: `$XDG_CONFIG_HOME/my-little-mind-map/config.json` (default `~/.config/my-little-mind-map/config.json`).
    - macOS: `~/Library/Application Support/my-little-mind-map/config.json`.
    - Windows: `%APPDATA%\my-little-mind-map\config.json`.
  - **Web** — browser `localStorage` (for config data only, not for user data). Config key prefix: `mlmm:config:*`. FSA folder handle and path reference are stored here; actual data files are accessed via File System Access API ([S-ST-LS3](storage.md)).
  - **Mobile** — app local storage or secure storage.
- [S-CFG-2] Defaults for settings are platform-specific:
  - **Desktop**:
    - Default data folder: `~/MyLittleMindMapData`.
    - Default sync: disabled.
  - **Web**:
    - No default data folder; user must select one via `showDirectoryPicker()` on first launch ([S-UX-SA1](ux.md)). Selected folder path and FSA handle are stored in browser `localStorage` (key: `mlmm:config:fsa-handle`).
    - Default sync: disabled.
  - **Mobile**:
    - Default data folder: `MyLittleMindMapData` in app local storage / secure storage.
    - Default sync: disabled.
- [S-CFG-3] Other settings and preferences are stored in `settings.json` inside the data folder (see [S-ST-DM4](storage.md#storage-data-model)).
