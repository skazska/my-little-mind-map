# plan CLI

Spec: [SPEC.md](SPEC.md) | Source: [src/](src/) | Project tracking: [../project/TOOLING.md](../project/TOOLING.md)

## Commands

### new-milestone

Scaffold a new milestone with companion docs and append to `PLAN.md`.

```bash
npm run plan new-milestone <M> "<description>" [options]

npm run plan new-milestone MVP5 "AI-powered features" \
  --goal "Implement summarisation" \
  --goal "Add semantic search" \
  --requirement "REQ_1: OpenAI integration"
```

Options: `--goal`, `--requirement`, `--blocker`, `--open-question`, `--section "Name=item"` (all repeatable)

---

### new-sprint

Scaffold a new sprint inside a milestone.

```bash
npm run plan new-sprint <M> <S> "<description>" [options]

npm run plan new-sprint MVP5 sprint-1 "Summarisation MVP" \
  --deliverable "DLV_1: Summary panel in desktop app"
```

Options: same as `new-milestone` plus `--deliverable`

---

### new-task

Scaffold a new task inside a sprint.

```bash
npm run plan new-task <M> <S> <T> "<description>" [options]

npm run plan new-task MVP5 sprint-1 task-1 "Integrate OpenAI SDK" \
  --design-note "DN_1: Use streaming API for incremental output" \
  --acceptance-criterion "AC_1: Summary renders in < 3 s"
```

Options: same as `new-sprint` plus `--design-note`, `--acceptance-criterion`

---

### update-status

Set the status of any artifact (milestone, sprint, or task).

```bash
npm run plan update-status <M[-S[-T]]> <status>

npm run plan update-status MVP5-sprint-1-task-1 in-progress
npm run plan update-status MVP5-sprint-1 done
npm run plan update-status MVP5 done
```

Valid statuses: `planned` | `in-progress` | `blocked` | `done`

---

### rollup

Compute and write roll-up status from children (tasks → sprint, sprints → milestone).

```bash
just plan rollup                    # all milestones
just plan rollup MVP5               # all sprints in MVP5, then MVP5 itself
just plan rollup MVP5 sprint-1      # tasks in sprint-1, then sprint-1 only
```

Roll-up rules: any `blocked` → `blocked`; any `in-progress` → `in-progress`; all `done` → `done`; else `planned`.

---

### patch

Append an item to a named section in any artifact file.

```bash
just plan patch <M[-S[-T]]> --section <name> --add "<item>" [--link <url>]

just plan patch MVP5 --section "Open questions" --add "Q_1: Which LLM provider?"
just plan patch MVP5-sprint-1 --section Blockers \
  --add "BLK_1: API key not provisioned" \
  --link "https://example.com/issue/42"
```

---

### validate

Check the project documentation for consistency issues.

```bash
just plan validate            # all milestones
just plan validate MVP5       # only MVP5
```

Checks: broken relative links · non-canonical filenames · invalid status values · roll-up inconsistencies. Exits 1 if violations found; prints each as `file:line: message`.

## Naming reference

| Artifact | Path |
|---|---|
| Milestone | `project/{M}.md` |
| Sprint | `project/{M}/{M}-{S}.md` |
| Task | `project/{M}/{M}-{S}/{M}-{S}-{T}.md` |

Names may contain hyphens. The CLI uses filesystem presence to resolve ambiguity when parsing composite `M[-S[-T]]` arguments.
