# Plan

## POC

Goals:

1. proof dev and support effort minimization approaches:
   1.1. rust-core reusable, maximization
   1.2. platforms ui implementations minimization
   1.3. architect decisions and exact expectations
2. proof both AI and human usability optimization approaches:
   2.1. Text-centric content first view and editing approaches is usable and useful for both human users and AI agents.
   2.2. Rich interlinking approaches are usable and useful for both human users and AI agents.
   2.3. Error handling and intentions-driven launch approaches are usable and useful for both human users and AI agents.
   2.4. Minimalistic, intuitive, responsive UI/UX approaches are usable and useful for both human users and AI agents.
   2.5. Local-first storage and cloud sync approaches are usable and useful for both human users and AI agents.
3. proof wide range of product applicability approaches:
   Within the POC's Desktop + Web scope these are **demonstrated by example, not exhaustively proven**: the POC shows that the same general primitives (notes, spaces, labels, views, references) compose to fit each use case, rather than shipping use-case-specific features or validating every use case end-to-end.
   3.1. Text-centric content-first view and editing approaches are demonstrated to generalise across use cases — personal note-taking, team project management, knowledge base, and agent memory.
   3.2. Rich interlinking approaches are demonstrated to generalise across the same range of use cases.
   3.3. Error handling and intention-driven launch approaches are demonstrated to generalise across the same range of use cases.
   3.4. Minimalistic, intuitive, responsive UI/UX approaches are demonstrated to generalise across the same range of use cases.
   3.5. Local-first storage (with sync delegated to version-control hosting) approaches are demonstrated to generalise across the same range of use cases.
4. proof the core features of the product are usable and useful for both human users and AI agents, and for a wide range of use cases, from personal note-taking to team project management, knowledge base, and agent memory.

Scope: Desktop App + Web App.

status: IN-Progress

notes:

- no task management for POC, just implementation based on specs and expectations.

## MVP1

Mobile Apps, Web App, Desktop App.

status: TBD

## MVP2

Improoved features:

Better UX:

- More integrations for collecting data e.g. web clipper, email, calendar (to keep track on plans), etc.
- Better visualisation of data and relations e.g. graph view, mind map view, (- why both?) etc.

status: TBD
