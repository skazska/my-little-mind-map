# Architecture Spec (Summary)

Spec IDs in this document use the `S-ARCH-*` prefix. Full architecture details live in [architecture.md](../architecture.md).

Satisfies: @E-CROSS-PLATFORM (`S-ARCH-*`), @E-STANDARDS (shared-core architecture).

### S-ARCH-1

Shared core in Rust with platform-appropriate bindings for each shell:

- **S-ARCH-1a** — Desktop and mobile shells use [UniFFI](https://mozilla.github.io/uniffi-rs/) to call the Rust core from native UI code (Swift/Kotlin/TypeScript via Tauri).
- **S-ARCH-1b** — The web shell compiles the Rust core to [WebAssembly (WASM)](https://webassembly.org/) and calls it from TypeScript via the generated WASM bindings. This is the specified exception to UniFFI for the web shell; see @S-ARCH-3.

### S-ARCH-2

Maximize shared logic and minimize platform-specific code in shells.

### S-ARCH-3

Prefer shells implemented in native UI frameworks for best performance and user experience, with fallback to a web-based shell where needed for cross-platform consistency and development speed.
