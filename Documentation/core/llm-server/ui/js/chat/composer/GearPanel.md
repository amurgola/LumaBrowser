# GearPanel

`core/llm-server/ui/js/chat/composer/GearPanel.js`

The composer's gear panel, this chat's options: Attach a file (desktop), the
model row (keeps the `cm-model-pill` class the picker anchors to and the PWA's
info intercept reads) with a one-line launch-plan summary, Suggest replies,
Watch the browser tab live (a global preference), and the per-chat tool list.

## Methods

- `toggle(btn)`, `open(btn)`, `close()`, `fit()` (re-fit under the clip edge on
  resize and whenever the tool list grows).
- `GearPanel.fillPlanLine(line, serverStatus)`: "Running: Full GPU offload ·
  16,384 ctx" from the planner's Decision note (first clause, split on ". " or the
  planner's dash, never inside "llama.cpp"); hidden unless ready or starting.

Clicks inside the panel or its nested model popover keep it open.
