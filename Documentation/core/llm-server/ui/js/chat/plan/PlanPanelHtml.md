# PlanPanelHtml

`core/llm-server/ui/js/chat/plan/PlanPanelHtml.js`

Markup of the [PlanPanel](PlanPanel.md).

## Methods

- `PlanPanelHtml.build(plan, { collapsed, canClear, working })`: '' for a plan without
  steps, else
  - the head: fold toggle (`data-plan-toggle`, `aria-expanded`), "Plan", `2 of 5 done`,
    the step being worked on (only when folded) and Clear (`data-plan-clear`, only with
    `canClear`, disabled while `working`);
  - the progress bar (`role="progressbar"`, the one place the accent is used);
  - unless folded, the steps in order (`.cm-plan-step` with `is-done`, `is-current` or
    `is-todo`, a check mark for a finished step and the words "Done" or "In progress")
    and the model's line on why the plan last changed (`.cm-plan-why`).
- `steps(plan)`: the plan's steps narrowed to those with text; a value that is not a
  plan gives none.
- `current(steps)`: the step in progress, else the first one not completed, else null.

All text is escaped with HtmlEscaper. A step's state is always a word beside the mark,
never colour alone.
