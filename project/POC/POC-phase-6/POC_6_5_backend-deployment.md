# Task 6.5 — Backend Deployment

> Deploy the backend service as a Docker container or standalone binary.

| | |
|---|---|
| **Phase** | [Phase 6: Polish & Release](../POC-phase-6-status.md) |
| **Requirements** | P6-R9 |
| **Decisions** | D-003 (file-based storage), D-012 (single-user) |
| **Depends on** | 6.1 |
| **Blocks** | — |
| **Status** | Not started |

---

## Goal

Make the backend service deployable as a Docker container or standalone binary on a VPS.

## Scope

### Docker

- `backend-service/Dockerfile` — already exists, update as needed
- `docker-compose.yml` — update with volume mounts for data persistence
- Data volume: mount host directory for `backend-data/` (file-based storage)

### Standalone Binary

- `cargo build --release -p backend-service`
- Binary + systemd service file
- Configuration via environment variables: `STORAGE_ROOT`, `PORT`, `HOST`

### Configuration

| Env var | Default | Description |
|---------|---------|-------------|
| `STORAGE_ROOT` | `./backend-data` | Root directory for file storage |
| `PORT` | `3000` | HTTP listen port |
| `HOST` | `0.0.0.0` | HTTP listen address |

### Deployment Verification

- Health check: `curl http://host:port/health`
- Create a note via API
- Verify data persists in storage directory

> See [docs/release.md](../../docs/release.md) for full deployment process.

### Changes

- `backend-service/Dockerfile` — update for file storage volume
- `docker-compose.yml` — add volume mount
- `backend-service/src/main.rs` — read config from env vars
- Deployment documentation update

## Tests

- [ ] Docker build succeeds
- [ ] Docker container starts and health check passes
- [ ] Data persists across container restarts (volume mount)
- [ ] Standalone binary starts and serves requests
- [ ] Environment variables configure storage root and port

## Acceptance Criteria

- [ ] Docker image builds and runs
- [ ] Data persists via volume mount
- [ ] Environment-based configuration works
- [ ] Health check, CRUD API, sync API all functional in deployed environment
