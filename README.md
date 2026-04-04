# my-little-mind-map

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
Need to keep all the contexts of project: goals, requirements, design decisions, implementation details, processes.
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
Notion: databases (- why might need this?), relations (- what this about?), views (- some details?), templates (- not sure, how to use?).
Roam Research: bidirectional links (- interesting what & how?), daily notes (- useful?), query language (- powerful?).
Logseq: outlining (- what is it?), backlinks (- like bidirectional?), block references (- what is it?), local-first sync (- what good?).
Miro: visual collaboration, mind mapping, whiteboarding.

## Key

Text centered, text is a keystone artifact, other artifacts must be referenced in some text.
Classification is required.
Topics are items of classifications.
Angles are perspectives on topics, they can be used to group topics and artifacts in different ways.

## Plan

### POC

Desktop App with basic features: write, upload, paste from clipboard, screen-part capture, classify, link, sync to Backend Service.
Backend Service with basic features: store, sync, manage data.

### MVP1

Mobile App, Web App, Desktop App, Backend Service.

### MVP2

Improoved features:

Better UX:

- More integrations for collecting data e.g. web clipper (- what is it?), email (-how?), calendar (-to gather?), etc.
- Better visualisation of data and relations e.g. graph view, mind map view, (- why both?) etc.

### MVP3

More features:

- AI-powered features: summarisation, visualisation, hypothesis generation, search, etc.

### MVP4

More features:

- Building Angles: perspectives on topics, they can be used to group topics and artifacts in different ways.

## Tech Stack

Rust first.

Mobile Apps: Swift on iOS, kotlin on Android, FFI to rust lib that implements the biz logic and client for the API.
Desktop App: Tauri, FFI to rust lib that implements the biz logic and client for the API.
Web App: React, FFI to rust lib that implements the biz logic and client for the API.
[CRUX](https://github.com/redbadger/crux) 
Backend Service: Rust Axum/Actix-web.

## File structure

- libs: Rust libraries for business logic and API client, etc.
- mobile-apps: Swift and Kotlin projects for iOS and Android apps.
- desktop-app: Tauri project for desktop app.
- web-app: React project for web app.
- backend-service: Rust project for backend service.
- docs: documentation, design, etc.
- tests: integration tests, etc.

## Development process:

### infra structure, build system, CI/CD, deployment, etc.

GitHub for code hosting, issue tracking, project management, etc.
Monorepo at first stages, may split later if needed, multilanguage support.

Local first:

- Local containers for backend services, storage, etc.
- Local development and testing environment for mobile, desktop, web apps.

CI/CD:

- GitHub Actions for building, testing, and deploying apps and backend service.
- Deploy backend service to VPS.
- Deploy mobile apps to App Store and Google Play.
- Deploy desktop app to GitHub Releases.
- Deploy web app to VPS.

