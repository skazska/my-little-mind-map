---
name: manage-project-flow-data
description: 'Create and maintain project-flow documentation for PLAN, milestones, sprints, and tasks. Use when adding or updating milestone folders, sprint/task files, and status tracking links in project docs.'
argument-hint: 'yaml with fields:
  new_{milestone|sprint|task}:
    name: {MILESTONE_NAME}[-{SPRINT}[-{TASK}]]:
    position?: position in the parent file (PLAN.md for milestones, milestone file for sprints, sprint file for tasks) or "end" (default) to add at the end of the section
    description: short description of the milestone/sprint/task
    goals:
      - GOAL_{GOAL_CODE}: description
      - ...
    requirements:
      - REQ_{REQUIREMENT_CODE}: description
      - ...
    design_notes?:
      - DN_{DESIGN_NOTE_CODE}: description
      - ...
    deliverables?:
      - DLV_{DELIVERABLE_CODE}: description
      - ...
    open_questions?:
      - Q_{QUESTION_CODE}: description
      - ...
    acceptance_criteria?:
      - AC_{AC_CODE}: description
      - ...
    blockers?:
      - BLK_{BLOCKER_CODE}: description
      - ...
    {custom_section_name}?:
      - {CODE}: description
      - ...
  patch_{milestone|sprint|task}:
    name: {MILESTONE_NAME}[-{SPRINT}[-{TASK}]]:
    description?: short description of the milestone/sprint/task
    {goals|requirements|design_notes|deliverables|open_questions|acceptance_criteria|decisions|status|results|blockers|custom_section_name}?:
      - {section_code}: description
      - ...
  rename_{milestone|sprint|task}:
    old_name: {MILESTONE_NAME}[-{SPRINT}[-{TASK}]]
    new_name: {MILESTONE_NAME}[-{SPRINT}[-{TASK}]]
  update_{milestone|sprint|task}:
    name: {MILESTONE_NAME}[-{SPRINT}[-{TASK}]]
    status?: planned | in-progress | blocked | done
    decisions?:
      - D_{DECISION_CODE}: description
      - ...
    results?:
      - R_{RESULT_CODE}: description
      - ...
  details_{milestone|sprint}:
    name: {MILESTONE_NAME}[-{SPRINT}]
    requirements?:
      - REQ_{REQUIREMENT_CODE}: details
      - ...
    decisions?:
      - D_{DECISION_CODE}: details
      - ...
    results?:
      - R_{RESULT_CODE}: details
      - ...
'
user-invocable: true

---

# Manage Project Flow Data

Create and update planning artifacts in `project/` using the repository [project-flow](../../../docs/project-flow.md) conventions.

create PLAN.md if it does not exist.

Use this skill when you need to:
- Add, patch milestones
- Add, patch sprints for milestone
- Add, patch tasks in a sprint
- Update task, sprint, milestone status, results, decisions so progress stays internally consistent
- Rename milestones, sprints, or tasks to keep naming consistent and clear
- Add details to milestone or sprint requirements, decisions, or results as dedicated files linked from summary file.
- Add artifact files to milestone, sprint, or task folders to be linked from summary file. 

## Inputs

For all operations except adding artifact files, input should follow the YAML structure defined in the `argument-hint` field above. For adding artifact files, input should include the target milestone/sprint/task, and link to the file to be added.

## Canonical Conventions

Use one canonical naming scheme across milestones, sprints/phases, and tasks. Do not preserve inconsistent legacy naming in new edits.

- Milestone summary file: `project/{MILESTONE}.md`
- Milestone folder: `project/{MILESTONE}/`
- Sprint summary file: `project/{MILESTONE}/{MILESTONE}-{SPRINT}.md`
- Sprint folder: `project/{MILESTONE}/{MILESTONE}-{SPRINT}/`
- Task file: `project/{MILESTONE}/{MILESTONE}-{SPRINT}/{MILESTONE}-{SPRINT}-{TASK}.md`
- Task folder (optional): `project/{MILESTONE}/{MILESTONE}-{SPRINT}/{MILESTONE}-{SPRINT}-{TASK}/`

Use a fixed status vocabulary for all roll-ups:
- `planned`
- `in-progress`
- `blocked`
- `done`

## Templates
File template for milestones, sprints, and tasks summary files:
```
# {MILESTONE} / {MILESTONE}-{SPRINT} / {MILESTONE}-{SPRINT}-{TASK}

Milestone [{MILESTONE}]({link to parent file (PLAN.md, milestone file, or sprint file)})
Sprint [{SPRINT}]({link to parent file (PLAN.md, milestone file, or sprint file)}) - if this is a sprint or task file
Task {TASK} - if this is a task file

short description.

## Goals
- [GOAL_1]
- [GOAL_2]
...

[## Blockers] - optional
- [BLK_1](link to blocker details file and section if exists)
- [BLK_2](link to blocker details file and section if exists)
...

## Requirements
- [REQ_1]
- [REQ_2]
... 

## Open questions
- [Q_1]
- [Q_2]
... 

[##Design notes] - optional, for tasks
- [DN_1]
- [DN_2]
...

[## Decisions] - not for tasks
- [D_1]
- [D_2]
...

[## Deliverables] - optional, not for milestones
- [DLV_1]
- [DLV_2]
...

[## Acceptance criteria] - optional, for tasks
- [AC_1]
- [AC_2]
...

## Status
[planned | in-progress | blocked | done]

[## Results and learnings] - optional
- [R_1]
- [R_2]
...

[Additional sections as needed, e.g. design notes for tasks, results and learnings for milestones, etc.]

```

Template for milestone/sprint requirements, decisions, and results details files:
```
# {MILESTONE} / {MILESTONE}-{SPRINT} / {MILESTONE}-{SPRINT}-{TASK} {section}

Summary: link to the milestone/sprint/task summary file and section.
[{Description}].
[{Links}].

## [CODE]

Description

## [CODE]

Description

...

```

## Workflow

1. Locate plan and milestone context
- Open `project/PLAN.md` and find the relevant milestone entry.
- Inspect existing milestone files/folders to confirm naming conventions and document layout.
- Determine whether this is creation or update.

2. Ensure milestone artifacts exist and are current
- For a new milestone, create a milestone file and milestone folder with required companion docs used by this repository.
- For an existing milestone, update goals, requirements, open-questions, decisions, status, and results sections as needed.
- Keep links between milestone summary and milestone folder files current.

3. Ensure sprint/phase artifacts exist and are current
- Create or update sprint/phase summary file under the milestone path.
- Create or update sprint companion docs (goals, requirements, open-questions, decisions, status) if that pattern is used for the milestone.
- Make sure sprint status reflects task states and blockers.

4. Ensure task artifacts exist and are current
- Create or update task file using task numbering and naming used in the sprint.
- Include goal, requirements, open-questions, design notes, deliverables, acceptance criteria, and status.
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

- Documentation-first: decisions, open-questions, requirements, and goals are documented before implementation status is marked complete.
- Traceability: each status update is backed by links to tasks and implementation artifacts when available.
- Consistency over novelty: prefer existing repository structure and naming conventions over inventing new ones.
- Minimal drift: update all impacted docs in one pass to avoid stale status snapshots.

## References

- Project flow guideline: `../../../docs/project-flow.md`
- Workspace policies: `../../../AGENTS.md`
