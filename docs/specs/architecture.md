# Architecture Spec (Summary)

Spec IDs in this document use the `S-ARCH-*` prefix. Full architecture details live in [architecture.md](../architecture.md).

- [S-ARCH-1] Shared core in Rust with UniFFI bindings for platform shells.
- [S-ARCH-2] Maximize shared logic and minimize platform-specific code in shells.
- [S-ARCH-3] Prefer shells implemented in native UI frameworks for best performance and user experience, with fallback to a web-based shell where needed for cross-platform consistency and development speed.
