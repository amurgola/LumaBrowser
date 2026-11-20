# PlanProgressText

`core/llm-server/chat/plan/PlanProgressText.js`

Where a plan stands and what the model does with it next, in one wording shared by
the `update_plan` card, the tool's answer to the model ([PlanTool](PlanTool.md)) and
the plan status at the prompt's tail ([PlanReminder](PlanReminder.md)).

## Methods

- `PlanProgressText.summary(steps)`: `Step 2 of 5: Compare the prices`,
  `All 5 steps completed.` or `CLEARED` ("Plan cleared.") for no steps.
- `PlanProgressText.nextCall(steps)`: the exact call that finishes the step in
  progress, `When this step is finished, call update_plan with {"done": 2} before starting the next step.`;
  `LAST_STEP` ("This is the last step: your final answer completes it.") when the step
  in progress is the last; null when nothing is left to do.

Naming the literal call is deliberate: a small model follows `{"done": 2}` more
reliably than a description of it.
