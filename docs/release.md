# Release & Publish Guide

## Versioning

This project uses [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.

All Rust crates share a single version defined in the workspace `Cargo.toml`:

```toml
[workspace.package]
version = "0.1.0"
```

Frontend apps track their own versions in `package.json` but should stay in sync.

### Version bump checklist

When bumping the version:

1. Update `version` in `Cargo.toml` (workspace)
2. Update `version` in `desktop-app/package.json`
3. Update `version` in `desktop-app/src-tauri/tauri.conf.json`
4. Update `version` in `web-app/package.json`
5. Commit: `git commit -m "chore: bump version to X.Y.Z"`
6. Tag: `git tag vX.Y.Z`
7. Push: `git push origin main --tags`

---

## Release Targets

| Component | Artifact | Distribution |
|-----------|----------|-------------|
| Backend Service | Docker image / binary | VPS deployment |
| Desktop App | `.deb`, `.AppImage` (Linux), `.dmg` (macOS), `.msi` (Windows) | GitHub Releases |
| Web App | Static files (`dist/`) | VPS / CDN |
| iOS App | `.ipa` | App Store (future) |
| Android App | `.apk` / `.aab` | Google Play (future) |

---

## Backend Service

### Build release binary

```bash
cargo build --release -p backend-service
# Binary: target/release/backend-service
```

### Build Docker image

```bash
docker build -t mindmap-backend:latest -f backend-service/Dockerfile .
```

### Run Docker image

```bash
docker run -p 3000:3000 mindmap-backend:latest
```

### Deploy to VPS

```bash
# Option 1: Docker
ssh user@server 'docker pull <registry>/mindmap-backend:latest && docker compose up -d'

# Option 2: Binary
scp target/release/backend-service user@server:/opt/mindmap/
ssh user@server 'systemctl restart mindmap-backend'
```

#### Systemd service file (example)

```ini
# /etc/systemd/system/mindmap-backend.service
[Unit]
Description=My Little Mind Map Backend
After=network.target

[Service]
Type=simple
User=mindmap
ExecStart=/opt/mindmap/backend-service
Environment=RUST_LOG=info
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now mindmap-backend
```

---

## Desktop App (Tauri)

### Build release bundles

```bash
just build-desktop

# Or manually:
cd desktop-app
pnpm install
pnpm tauri build
```

**Output:** `desktop-app/src-tauri/target/release/bundle/`

| Platform | Bundle location |
|----------|----------------|
| Linux | `bundle/deb/*.deb`, `bundle/appimage/*.AppImage` |
| macOS | `bundle/dmg/*.dmg`, `bundle/macos/*.app` |
| Windows | `bundle/msi/*.msi`, `bundle/nsis/*.exe` |

### Cross-compilation

Tauri bundles are platform-specific. Build on each target OS, or use CI (see [CI/CD](#cicd-github-actions)).

### Publish to GitHub Releases

1. Build on all target platforms (via CI or manual)
2. Create a GitHub Release for tag `vX.Y.Z`
3. Upload bundle files as release assets

---

## Web App

### Build for production

```bash
just build-web
# Output: web-app/dist/
```

### Deploy to VPS / CDN

```bash
# Copy static files
rsync -avz web-app/dist/ user@server:/var/www/mindmap/

# Or use a CDN (e.g., Cloudflare Pages, Netlify, Vercel)
```

#### Nginx config (example)

```nginx
server {
    listen 80;
    server_name mindmap.example.com;
    root /var/www/mindmap;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## CI/CD (GitHub Actions)

### Current pipeline (`.github/workflows/ci.yml`)

Runs on every push/PR to `main`:

| Job | Steps |
|-----|-------|
| **rust** | Format check → Clippy → Build → Test (all Rust crates) |
| **web** | pnpm install → Build web-app |

### Release workflow (to be added)

Create `.github/workflows/release.yml` when ready to automate releases:

```yaml
name: Release

on:
  push:
    tags: ['v*']

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo build --release -p backend-service
      - uses: actions/upload-artifact@v4
        with:
          name: backend-linux
          path: target/release/backend-service

  desktop-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - name: Install system deps
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev \
            libappindicator3-dev librsvg2-dev patchelf \
            libgtk-3-dev libsoup-3.0-dev \
            libjavascriptcoregtk-4.1-dev
      - run: cd desktop-app && pnpm install && pnpm tauri build
      - uses: actions/upload-artifact@v4
        with:
          name: desktop-linux
          path: desktop-app/src-tauri/target/release/bundle/

  desktop-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: cd desktop-app && pnpm install && pnpm tauri build
      - uses: actions/upload-artifact@v4
        with:
          name: desktop-macos
          path: desktop-app/src-tauri/target/release/bundle/

  desktop-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: cd desktop-app && pnpm install && pnpm tauri build
      - uses: actions/upload-artifact@v4
        with:
          name: desktop-windows
          path: desktop-app/src-tauri/target/release/bundle/

  web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: cd web-app && pnpm install && pnpm build
      - uses: actions/upload-artifact@v4
        with:
          name: web-dist
          path: web-app/dist/

  publish:
    needs: [backend, desktop-linux, desktop-macos, desktop-windows, web]
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/download-artifact@v4
      - uses: softprops/action-gh-release@v2
        with:
          files: |
            backend-linux/backend-service
            desktop-linux/**/*
            desktop-macos/**/*
            desktop-windows/**/*
            web-dist/**/*
```

---

## Release Checklist

### Pre-release

- [ ] All tests pass: `just ci`
- [ ] Version bumped in all locations (see [Version bump checklist](#version-bump-checklist))
- [ ] CHANGELOG updated (if maintained)
- [ ] Branch merged to `main`

### Release

- [ ] Tag: `git tag vX.Y.Z && git push origin vX.Y.Z`
- [ ] GitHub Release created (auto via CI, or manual)
- [ ] Artifacts verified (download and test bundles)

### Post-release deploy

- [ ] Backend deployed to VPS
- [ ] Web app deployed to VPS/CDN
- [ ] Desktop bundles uploaded to GitHub Releases
- [ ] Smoke test all deployed services

### Mobile (future)

- [ ] iOS: Upload to App Store Connect, submit for review
- [ ] Android: Upload to Google Play Console, submit for review
