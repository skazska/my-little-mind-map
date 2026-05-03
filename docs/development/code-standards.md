# Code Standards

## Terms

- code items: function, method, param, type, variable, etc.
- code purpose: the reason why the code item exists, what it does, what it is for, etc.

## Policies

### General

- simple and idiomatic
- readability and maintainability over cleverness
- community conventions and best practices
- lint and format
- purpose-driven, code-lines are not the main metric.
- no code errors
- no code warnings in main branches
- CI must pass before merge
- no dead code, no commented-out code without clear purpose and `TODO|FIXME`.

### Code item

- Clear purpose:
  - name: descriptive, concise, purpose-aligned. But not: too long.
  - header comment: describe purpose, behavior, usage. But not: too long, implementation details, etc.
- No dublication:
  - by purpose: no purpose overlap, purpose-based abstract code items must be extracted to separate code items and reused.
  - not by code lines: code-parts migh look similar but have different purposes, so they are not dublicates.
- Purpose-driven:
  - no purpose-mixing, clear separation of concerns, single responsibility principle.
  - no purpose-splitting, code items should not be split into multiple code items without clear purpose separation.

### File

- Clear purpose:
  - file name: descriptive, concise, purpose-aligned. But not: too long.
  - header comment: describe purpose, usage for entry points, approaches, techniques, standards, etc. But not: too long, implementation details, etc.
- No purpose-mixing, clear separation of concerns, single responsibility principle.
- No purpose-splitting, file should not be split into multiple files without clear purpose separation.

### Per-language standards

- Rust: [RUST.md](code-standards/RUST.md)
- TypeScript: [TS-REACT.md](code-standards/TS-REACT.md)
