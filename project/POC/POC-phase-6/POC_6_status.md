# Phase 6 Status — Polish & Release

> Error handling, keyboard shortcuts, settings, packaging, and deployment.

Requirements: [POC-phase-6-requirements.md](POC-phase-6-requirements.md)
Decisions: [POC-decisions.md](POC-decisions.md)

---

## Tasks

| # | Task | Depends on | Status | Definition |
|---|------|-----------|--------|------------|
| 6.1 | Error handling and user feedback | All phases | Not started | [6.1_error-handling.md](POC-phase-6/6.1_error-handling.md) |
| 6.2 | Keyboard shortcuts | Phase 2 (2.1) | Not started | [6.2_keyboard-shortcuts.md](POC-phase-6/6.2_keyboard-shortcuts.md) |
| 6.3 | App settings (backend URL, sync interval, etc.) | Phase 5 (5.2) | Not started | [6.3_app-settings.md](POC-phase-6/6.3_app-settings.md) |
| 6.4 | Desktop app packaging and release | 6.1 | Not started | [6.4_desktop-packaging.md](POC-phase-6/6.4_desktop-packaging.md) |
| 6.5 | Backend deployment | 6.1 | Not started | [6.5_backend-deployment.md](POC-phase-6/6.5_backend-deployment.md) |

---

## Phase Status

**Status: Not started** — Blocked on all prior phases.

### Dependency Graph

```
All phases
 └──→ 6.1 (error handling)
       ├──→ 6.4 (desktop packaging)
       └──→ 6.5 (backend deployment)
Phase 2 (2.1)
 └──→ 6.2 (keyboard shortcuts)
Phase 5 (5.2)
 └──→ 6.3 (app settings)
```

### Notes

- 6.2 (keyboard shortcuts) can start as soon as the editor exists (Phase 2)
- 6.3 (settings) needs the HTTP capability from Phase 5 for backend URL config
- 6.4 and 6.5 are final release tasks — depend on error handling being in place
