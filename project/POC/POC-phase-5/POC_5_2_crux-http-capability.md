# Task 5.2 — CRUX HTTP Capability for Backend Communication

> Add HTTP capability to the CRUX core for communicating with the backend service.

| | |
|---|---|
| **Phase** | [Phase 5: Sync](../POC-phase-5-status.md) |
| **Requirements** | P5-R9, NFR-3.1 |
| **Decisions** | D-006 (sync strategy) |
| **Depends on** | 5.1 |
| **Blocks** | 5.3, 5.4, Phase 6 (6.3) |
| **Status** | Not started |

---

## Goal

Add HTTP request capability to the CRUX shared core so that sync operations can call the backend API.

## Scope

### CRUX HTTP Effect

Add a new effect variant for HTTP requests:

```rust
#[effect(typegen)]
pub enum Effect {
    Render(RenderOperation),
    Http(HttpOperation),
}
```

The CRUX framework provides `crux_http` crate for this purpose. Evaluate:

1. Does `crux_http` (0.17-compatible) exist and fit our needs?
2. If not, define a custom `Http` effect with request/response types

### Custom HTTP Effect (if crux_http doesn't fit)

```rust
pub enum HttpOperation {
    Request {
        method: HttpMethod,
        url: String,
        headers: HashMap<String, String>,
        body: Option<Vec<u8>>,
    }
}

pub enum HttpMethod { Get, Post, Put, Delete }

pub struct HttpResponse {
    pub status: u16,
    pub body: Vec<u8>,
}
```

### Shell Integration

The Tauri shell handles the `Http` effect:

1. CRUX emits `Effect::Http(request)`
2. Tauri shell receives effect
3. Tauri shell makes actual HTTP call (using `reqwest` or Tauri HTTP plugin)
4. Tauri shell sends response back to CRUX as an event
5. CRUX processes response in `update()`

### Changes

- `shared/Cargo.toml` — add `crux_http` or custom HTTP types
- `shared/src/app.rs` — add `Http` effect, sync-related events for responses
- `desktop-app/src-tauri/Cargo.toml` — add `reqwest` for HTTP calls
- `desktop-app/src-tauri/src/lib.rs` — handle `Http` effect

### Configuration

Backend URL needed for HTTP calls. For now: hardcoded default `http://localhost:3000`. Configurable in Phase 6 (task 6.3).

## Tests

- [ ] CRUX can emit Http effect
- [ ] Tauri shell can handle Http effect and make real HTTP call
- [ ] Response correctly routed back to CRUX as event
- [ ] Error (network failure) handled gracefully

## Acceptance Criteria

- [ ] HTTP capability added to CRUX Effect enum
- [ ] Tauri shell handles HTTP effects
- [ ] Round-trip: CRUX effect → HTTP call → response event works
- [ ] `cargo build --workspace` succeeds
