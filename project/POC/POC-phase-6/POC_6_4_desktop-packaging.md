# Task 6.4 — Desktop App Packaging and Release

> Package the desktop app for distribution on Linux, macOS, and Windows.

| | |
|---|---|
| **Phase** | [Phase 6: Polish & Release](../POC-status.md) |
| **Requirements** | P6-R8, P6-R10 |
| **Decisions** | — |
| **Depends on** | 6.1 |
| **Blocks** | — |
| **Status** | Cancelled |

---

## Goal

Build installable desktop app packages for target platforms.

## Scope

### Targets

| Platform | Format | Build on |
|----------|--------|----------|
| Linux | `.deb`, `.AppImage` | Linux (CI or local) |
| macOS | `.dmg` | macOS (CI) |
| Windows | `.msi` | Windows (CI) |

### Build Process

- `just build-desktop` runs `cd desktop-app && npm run build`
- Tauri v2 handles platform-specific bundling
- Output: `desktop-app/src-tauri/target/release/bundle/`

> See [docs/release.md](../../../docs/release.md) for full release process.

### CI/CD

- GitHub Actions workflow for building on all platforms
- Triggered by version tag push (`v*`)
- Artifacts uploaded to GitHub Releases

### Changes

- `.github/workflows/release.yml` — release build workflow
- `desktop-app/src-tauri/tauri.conf.json` — verify bundle settings
- Version bump checklist (from docs/release.md)

### Pre-Release Checklist

- [ ] All tests pass
- [ ] Version bumped in all manifests
- [ ] Error handling reviewed (6.1)
- [ ] Performance baselines met (P6-R10)
- [ ] Settings UI works (6.3)

## Tests

- [ ] `just build-desktop` produces installable package
- [ ] Package installs and runs on target OS
- [ ] App starts, creates data directory, basic operations work

## Acceptance Criteria

- [ ] Desktop app packages build for Linux (.deb, .AppImage)
- [ ] CI workflow produces release artifacts
- [ ] Installed app works end-to-end
