# Project flow

Project flow guidelines, including planning, requirements gathering, decision making, and other project management practices.

Project data and documentation in `project/`.

Project idea, vision, and goals in `project/IDEA.md`.

## policies

- **documentation-first**:
  - refer to guidelines,
  - document what going to do,
  - rich internal linking in documentation,
  - specs then implementation.
- **plan changes, not calendar**:
  - no deadlines and time estimates, plan changes and iterations instead.
  - tasks are "units of change", sprints are "transitions between consistent states of the product".
- (TBD: plan tokens)

## terms

- product increment: changes proposed to add or improve new features.
- bug fix: changes proposed to fix bugs or issues in the existing features.
- refactor: changes proposed to improve code quality, structure, or performance without changing functionality.
- address code review comments: changes proposed to address feedback from code reviews, such as improving code readability, adding tests, etc.
- chore: changes proposed to maintain or improve the development process, such as updating dependencies, configuring tools, etc.
- documentation: changes proposed to improve documentation (dev, project, spec), actualize docs, add new docs, update statuses.
- plan & research: activities related to planning and researching for milestones, sprints, and tasks, including creating and updating project documentation, researching solutions, etc.
- iteration: can be one or set of any of the above change types planed or unplanned, included in pull request.
- task: planned unit of change that can be implemented, tested, and reviewed within a sprint/phase, with clear goal, requirements, design, acceptance criteria, and deliverables.
- sprint/phase: planned transition between consistent states of the product, consisting of a set of tasks that can be performed in parallel or sequentially, with clear requirements, decisions, and status.
- milestone: a significant stage or event in the project, such as POC, MVP, etc.

## Flow structure

1. [PLAN](../project/PLAN.md) - high-level plan and roadmap, milestones (like POC, POC3, MVP etc.).
2. Each milestone consists of sprints/phases and represented by file `project/{MILESTONE}.md` containing overall requirements, open-questions, decisions, status and `results and learnings`, and a folder `project/{MILESTONE}/` with optioonal:
    - `{MILESTONE}-requirements.md` - milestone requirements details.
    - `{MILESTONE}-decisions.md` - milestone implementation decisions details.
    - `{MILESTONE}-status.md` - per phase/sprint.
    - `{MILESTONE}-results.md` - results and learnings from this milestone, including further PLAN change decisions.
3. Each phase/sprint consists of tasks and represented by file `project/{MILESTONE}/{MILESTONE}-sprint-{NUM}.md` with overall requirements, open-questions, decisions and status and a folder `project/{MILESTONE}/{MILESTONE}-sprint-{NUM}/` with optional:
    - `{MILESTONE}-{NUM}-requirements.md` - requirements for this phase/sprint, including features, improvements, bug fixes, etc.
    - `{MILESTONE}-{NUM}-decisions.md` - decisions made for this phase/sprint implementations, including design choices, trade-offs, etc.
    - `{MILESTONE}-{NUM}-status.md` - current status of this phase/sprint.
4. Each task represented by file `project/{MILESTONE}/{MILESTONE}-sprint-{NUM}/{TASK_NUM}_{TASK_NAME}.md` with details of the task, including goal, requirements, open-questions, design, deliverables, acceptance criteria, etc. and optionally a folder `project/{MILESTONE}/{MILESTONE}-sprint-{NUM}/{TASK_NUM}_{TASK_NAME}/` with additional artifacts or implementation details.

## Flow process

Tasks can block each other and so sprints and milestones.

1. PLAN is created first, updated on each milestone completion if needed.
2. Each milestone planned in PLAN is to be created with its file and folder via one plan & research session for with all sprints or sprint by sprint plan & research series. Upon sprint completion, milestone status is to be updated.
3. Each sprint planned in milestone is to be created with its file and folder via one plan & research session for all tasks or task by task by task plan & research series. Upon task completion, sprint status is to be updated.
4. Sprints can be started as planned and not blocked.
5. Tasks can be performed in steps if needed, but should be completed in the same sprint.
6. All tasks produce changes in repository which should commited, pushed and merged via PR with addressing code-review comments according to [git flow guidelines](../git-flow.md). Task file and folder should be updated with links to PR, commits, and other relevant artifacts.

