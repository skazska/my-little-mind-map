# Configuration Spec

Spec IDs in this document use the `S-CFG-*` prefix.

Satisfies: [E-CROSS-PLATFORM](../expectations.md) (`S-CFG-*`).

- [S-CFG-1] Path to data folder and sync settings are platform-specific and stored in app settings (outside the data folder):
  - **Desktop** — OS-conventional config location:
    - Linux: `$XDG_CONFIG_HOME/my-little-mind-map/config.json` (default `~/.config/my-little-mind-map/config.json`).
    - macOS: `~/Library/Application Support/my-little-mind-map/config.json`.
    - Windows: `%APPDATA%\my-little-mind-map\config.json`.
  - **Web** — browser `localStorage`, using key prefix `mlmm:` to namespace all app data.
  - **Mobile** — app local storage or secure storage.
- [S-CFG-2] Defaults for settings are platform-specific:
  - **Desktop**:
    - Default data folder: `~/MyLittleMindMapData`.
    - Default sync: disabled.
  - **Web**:
    - Default data folder: `MyLittleMindMapData` stored under the `mlmm:` prefix in browser `localStorage`.
    - Default sync: disabled.
  - **Mobile**:
    - Default data folder: `MyLittleMindMapData` in app local storage / secure storage.
    - Default sync: disabled.
- [S-CFG-3] Other settings and preferences are stored in `settings.json` inside the data folder (see [S-ST-DM4](storage.md#storage-data-model)).
