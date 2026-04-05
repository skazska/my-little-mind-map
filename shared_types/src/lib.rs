// This crate provides generated FFI types for platform shells.
// Type generation is handled by crux_core's typegen feature.
//
// To generate types, run:
//   cargo build -p shared_types
//
// Generated types will be available for:
//   - Swift (iOS)
//   - Kotlin/Java (Android)
//   - TypeScript (Web/Desktop)

pub use shared::*;
