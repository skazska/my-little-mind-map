# my-little-mind-map

> **Note:** This is the original, broad and informal idea sketch — a vision reminder, not a business request or specification. It is **not** part of spec traceability and is **not** authoritative. For the actual product definition see [specs/expectations.md](specs/expectations.md), [specs/specs.md](specs/specs.md), and [specs/architecture.md](specs/architecture.md). Implementation choices and structure live in those documents and may differ from anything hinted at here.

## What?

Mobile, desktop, web apps, backend service for sync and storage.

## What for?

To collect, store, grow and manage context (Artifacts related to topics)
For ideas, projects, aims, hobbies, problems, skills (Topics)
And structure (Artifacts relations, Topics relations, Artifacts-Topics relations, Topic-hierarchy, Angles)

## How?

### Collect

Artifacts:

Write, draw, record speech, take photo/video/audio, import from other apps like save web page, email, calendar, notes, etc.

Link external data via URL, API-call, command line, etc.

Classify artifacts by topics, tag datetime locations and other metadata.
Interlink artifacts, topics.

### Store

Save data locally. Sync data to the cloud (backend service).

### Grow

Analyse, summarise, visualise, hypohesise, search, and generate new links, topics, topic-grouping with hierarchy, angles.

### Manage

Organise, filter, sort, archive, export, share, clean up, distill.

## Why

Growing old, hard to keep all the contexts in mind, switch quickly, concentrate.
Growing amount of information, hard to keep it in mind, switch quickly, concentrate.
AI requires quality context, so need a tools and data to be available for it.

### Learn Rust

As a person who wants to learn new programming language or programming in general.

Need to keep links to learning materials. Sometimes need keep learning materials themselves.
Extract essentials, create summaries, cheatsheets, pin important info or thigsh to return to later. I.o.w: make margin notes.

Plan learning process then track and remaind.

Need to keep quick usefull notes, cheatsheets, how-tos from eventual learning materials (appearin in feeds, conversations, etc.) to organize and review them later.

### Lead/track problems in projects

As technical lead.

Need to control actual and potential problems of product in development: identify, track, search and manage solutions. So need to keep all the contexts of problems and solutions.
Need to keep all the contexts of project: goals, expectations, design decisions, implementation details, processes.
Need to maintain the big picture on all layers: from mid-senior employees to stakeholders and be able to understand and explain with arguments using consistent interconnections across layers.

### Hobby

As a person who like hiking.

Need to gather information about trails, routes, weather, equipment, etc. and keep it in mind for planning and executing hikes. May need to keep logs of hikes, photos, etc. to remember and share.

As a person who wants to make portable stove for tent-sauna.

Need to learn much new things from OpenSCAD to welding, thermodynamics, materials, etc.
Find instruments, materials, suppliers, etc. and keep all the contexts in mind to plan and execute the project.

## So what

Use AI code generation to build the app faster, and make it more powerful.

## When

Start now, and keep improving it iteratively.

## Like What

Obsidian: writing markdown, linking notes, graph view, sync. Looks great.
Google Keep: quick notes, checklists, reminders, upload images, audio, drawings.
Notion: relations (like for views).
Roam Research: bidirectional links, daily notes (- useful?), query language (- powerful?).
Logseq: outlining (Nested hierarchical notes - bullets within bullets), backlinks (like bidirectional), block references (referencing parts), local-first sync.
Miro: visual collaboration, mind mapping, whiteboarding.

## Key

Text centered, text is a keystone artifact, other artifacts must be referenced in some text.
Note content is the source of truth, indexes, relations, references, and classifications are derived from it and must stay in sync with it.
Classification is required.
Topics are items of classifications.
Views are perspectives on topics, they can be used to group topics and artifacts in different ways.
Local first, sync to backend service, but can work without it.
Single-user data ownership.

## Direction (non-binding)

Shared business logic with thin platform clients; local-first with an optional sync/storage backend; build the app with AI assistance and iterate.

Concrete technology, repository structure, and delivery/CI choices are intentionally left out of this reminder — see [specs/architecture.md](specs/architecture.md) and [docs/development.md](docs/development.md) for the authoritative, current decisions.
