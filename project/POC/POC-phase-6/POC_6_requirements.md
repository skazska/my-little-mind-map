# Phase 6 Requirements — Polish & Release

> Phase scope: Error handling, keyboard shortcuts, settings, packaging, and deployment.

References: [POC-requirements.md](POC-requirements.md), [POC-decisions.md](POC-decisions.md)

---

## Applicable Requirements

### From POC Requirements

| Requirement | Relevance |
|-------------|-----------|
| NFR-6.1–6.3 | Performance baselines |
| All FR-* | Polish applies to all features |

### Phase-Specific Requirements

| ID | Requirement | Traces to |
|----|-------------|-----------|
| P6-R1 | All user-facing errors show meaningful messages (not raw errors) | — |
| P6-R2 | Network errors handled gracefully (retry, queue, inform user) | NFR-1.3, FR-D7.6 |
| P6-R3 | Storage errors handled (disk full, permission denied, corrupt file) | NFR-1.1 |
| P6-R4 | Keyboard shortcuts for common actions (new note, save, search, sync) | — |
| P6-R5 | Shortcuts documented and discoverable in app | — |
| P6-R6 | App settings: backend URL, sync interval, data directory | FR-D7, D-002 |
| P6-R7 | Settings persist locally | D-002 |
| P6-R8 | Desktop app packages for Linux (.deb, .AppImage), macOS (.dmg), Windows (.msi) | `README##Development process/CI/CD` |
| P6-R9 | Backend deployable as Docker container or standalone binary | `README##Development process/CI/CD` |
| P6-R10 | Performance meets NFR-6 baselines | NFR-6.1–6.3 |
| P6-R11 | All client apps display a persistent status bar showing storage path, counts, and version (D-014) | NFR-7.1–7.5 |

---

## Acceptance Criteria — Reconsidering

> Phase 6 tasks 6.1–6.5 cancelled due to POC pivots. See [POC-results.md](../POC-results.md).

- [ ] No raw error messages or stack traces shown to user
- [ ] Network errors trigger offline mode gracefully
- [ ] Keyboard shortcuts work for: new note, save, sync, search
- [ ] App settings UI allows configuring backend URL and data directory
- [ ] Desktop app builds produce installable packages for target OS
- [ ] Backend Docker image builds and runs successfully
- [ ] Performance baselines met (note save < 500ms, list < 1s for 1000 notes)
- [ ] All client apps show status bar with storage path, note/topic counts, and version (D-014)
