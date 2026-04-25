---
name: manage-project-flow-data
description: 'Create and maintain project-flow documentation for PLAN, milestones, sprints, and tasks. Use when adding or updating milestone folders, sprint/task files, and status tracking links in project docs.'
argument-hint: 'What milestone/sprint/task change should be made?'
user-invocable: true
---

# Manage Project Flow Data

Create and update planning artifacts in `project/` using the repository project-flow conventions.

Use this skill when you need to:
- Add or modify files and folders for a milestone defined in `project/PLAN.md`
- Add or modify files and folders for sprints/phases in that milestone
- Add or modify files and folders for tasks in a sprint/phase
- Update task, sprint, milestone, and PLAN status so progress stays internally consistent

## Inputs

Collect or infer these inputs before editing:
- Change type: new milestone, milestone update, new sprint, sprint update, new task, task update, status update
- Milestone identifier and canonical naming scheme used by this skill
- Sprint/phase identifier within the milestone
- Task number and short name
- Current and target status values
- Required links to related artifacts (requirements, decisions, results, PRs/commits)

If any identifier is unclear, inspect existing neighboring files first and match existing patterns.

## Canonical Conventions

Use one canonical naming scheme across milestones, sprints/phases, and tasks. Do not preserve inconsistent legacy naming in new edits.

- Milestone summary file: `project/{MILESTONE}.md`
- Milestone folder: `project/{MILESTONE}/`
- Sprint/phase summary file: `project/{MILESTONE}/{MILESTONE}-sprint-{NUM}.md`
- Sprint/phase folder: `project/{MILESTONE}/{MILESTONE}-sprint-{NUM}/`
- Task file: `project/{MILESTONE}/{MILESTONE}-sprint-{NUM}/{TASK_NUM}_{TASK_NAME}.md`

Use a fixed status vocabulary for all roll-ups:
- `planned`
- `in-progress`
- `blocked`
- `done`

## Workflow

1. Locate plan and milestone context
- Open `project/PLAN.md` and find the relevant milestone entry.
- Inspect existing milestone files/folders to confirm naming conventions and document layout.
- Determine whether this is creation or update.

2. Ensure milestone artifacts exist and are current
- For a new milestone, create a milestone file and milestone folder with required companion docs used by this repository.
- For an existing milestone, update requirements/decisions/status/results sections as needed.
- Keep links between milestone summary and milestone folder files current.

3. Ensure sprint/phase artifacts exist and are current
- Create or update sprint/phase summary file under the milestone path.
- Create or update sprint companion docs (requirements, decisions, status) if that pattern is used for the milestone.
- Make sure sprint status reflects task states and blockers.

4. Ensure task artifacts exist and are current
- Create or update task file using task numbering and naming used in the sprint.
- Include goal, requirements, design notes, deliverables, acceptance criteria, and status.
- Record implementation artifacts (PRs, commits, follow-ups) when available.

5. Update status chain bottom-up
- Update task status first.
- Roll up to sprint/phase status.
- Roll up to milestone status.
- Update `project/PLAN.md` milestone state only after lower-level statuses are aligned.

6. Validate consistency and links
- Verify every newly referenced file exists.
- Verify internal links are correct and relative.
- Check statuses are not contradictory across task/sprint/milestone/PLAN.
- Ensure wording follows "plan changes, not calendar" policy (no deadline-centric language).

## Decision Points

- If naming patterns differ between old and new milestones: apply canonical naming for all newly created artifacts and normalize touched artifacts to canonical names where feasible.
- If both phase-level and sprint-level terms appear: preserve existing terminology in that milestone.
- If required companion docs are missing for an existing structure: add minimally required files to restore consistency, then link them.
- If task completion evidence is missing (PR/commit links): mark status as in-progress or blocked, not done.

Status roll-up rules:
- If any child item is `blocked`, parent is `blocked`.
- Else if any child item is `in-progress`, parent is `in-progress`.
- Else if all child items are `done`, parent is `done`.
- Else parent is `planned`.

## Completion Checklist

- `project/PLAN.md` reflects the correct milestone state.
- Milestone file/folder and linked docs are present and mutually linked.
- Sprint/phase file/folder and linked docs are present and mutually linked.
- Task file exists/updated with clear status and acceptance criteria.
- All touched artifacts follow canonical naming.
- Status values use only: planned, in-progress, blocked, done.
- Status roll-up is consistent from task -> sprint/phase -> milestone -> PLAN.
- No broken internal links introduced.

## Quality Criteria

- Documentation-first: decisions and requirements are documented before implementation status is marked complete.
- Traceability: each status update is backed by links to tasks and implementation artifacts when available.
- Consistency over novelty: prefer existing repository structure and naming conventions over inventing new ones.
- Minimal drift: update all impacted docs in one pass to avoid stale status snapshots.

## References

- Project flow guideline: `../../../docs/project-flow.md`
- Workspace policies: `../../../AGENTS.md`
