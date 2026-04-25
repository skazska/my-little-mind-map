# Prerequisites

Install the following tools before starting development.

## Required (all platforms)

| Tool        | Version | Install |
|-------------|---------|---------|
| **Rust**    | stable  | [rustup.rs](https://rustup.rs/)                              |
| **just**    | latest  | `cargo install just`                                         |
| **Node.js** | 22 LTS+ | [nvm](https://github.com/nvm-sh/nvm)                         |
| **pnpm**    | 10+     | `corepack enable && corepack prepare pnpm@latest --activate` |
| **Docker**  | 24+     | [docker.com](https://docs.docker.com/get-docker/)            |

### Linux (Ubuntu/Debian) — Tauri system dependencies

```bash
sudo apt-get update
sudo apt-get install -y \
  pkg-config \
  libwebkit2gtk-4.1-dev \
  #libappindicator3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf \
  libgtk-3-dev \
  libsoup-3.0-dev \
  libjavascriptcoregtk-4.1-dev
```

## macOS — Tauri system dependencies

Xcode Command Line Tools (usually already installed):

```bash
xcode-select --install
```

## Windows — Tauri system dependencies

Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with the "Desktop development with C++" workload. WebView2 is included in Windows 10/11.

## Mobile development (optional, for later)

| Platform | Tool           | Install                                                           |
|----------|----------------|-------------------------------------------------------------------|
| iOS      | Xcode 15+      | Mac App Store                                                     |
| iOS      | Rust target    | `rustup target add aarch64-apple-ios`                             |
| Android  | Android Studio | [developer.android.com](https://developer.android.com/studio)     |
| Android  | Rust targets   | `rustup target add aarch64-linux-android armv7-linux-androideabi` |
| Android  | NDK            | Via Android Studio SDK Manager                                    |
