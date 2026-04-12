# Code Standards

## Terms

- code items: function, method, param, type, variable, etc.
- code purpose: the reason why the code item exists, what it does, what it is for, etc.

## Policies

- no code errors
- no code warnings in main branches
- CI must pass before merge
- purpose of code item must be clear via name with reasonable length, or comment.
- no purpose-mixing in 1 code item.
- purpose based reusability and deduplication, clear separation of concerns.

- keep it simple and idiomatic
- prefer readability and maintainability over cleverness
- follow community conventions and best practices
- always lint and format

### Per-language standards

- Rust: [RUST.md](code-standards/RUST.md)
- TypeScript: [TS-REACT.md](code-standards/TS-REACT.md)
