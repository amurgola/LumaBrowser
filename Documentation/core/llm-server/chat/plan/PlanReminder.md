# PlanReminder

`core/llm-server/chat/plan/PlanReminder.js`

Words a conversation's unfinished plan for the tail of the model's prompt, in full or
as one line. Both are null when there is no plan or every step is completed.

## Methods

- `PlanReminder.build(plan)`: a `<plan>` block: `HEAD`, one numbered line per step
  (`2. Compare the prices (in_progress)`), then the call that finishes the step in
  progress ([PlanProgressText](PlanProgressText.md)`.nextCall`) and `STALE`, which
  tells the model to replace or clear the plan when the user now asks for something
  else (the way out of a stale plan).
- `PlanReminder.status(plan)`: one bracketed line,
  `[Plan. Step 2 of 4: Compare the prices. When this step is finished, call update_plan with {"done": 2} before starting the next step.]`.

The states are written in the tool's own words so the model reads the same vocabulary
it writes. [PlanTool](PlanTool.md)`.reminder()` decides which of the two a request
carries.

## Why at the tail, and why mostly one line

A plan made many tool calls ago, or in an earlier turn, sits far back in the context
where a model stops attending to it. The tail is the part of the prompt read last and
is new on every request, so it costs no cached prefix. But every tail stays in the
history (TurnReminder writes it into the last message), so the full block on each step
would spend a plan's worth of tokens per tool call. The line is about 35 tokens and
names the one call that matters next.
