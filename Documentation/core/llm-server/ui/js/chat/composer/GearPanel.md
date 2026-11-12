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

## Reply choices (2026-11-09)

The "Suggest reply choices" row is left out when the active mode's listing
says `choices: false`: there is nothing to toggle, the router never adds the
document to that mode.

## A mode's own section (2026-11-12)

A chat mode whose definition has `renderGear(pop, ctx, panel)` owns the panel
below the model row. The hook is called with a `.cm-gear-mode` wrapper placed
after the model row and the plan line, the mode context
(`ModeContext.forHooks()`: the conversation, its meta, `setMeta`) and
`{ close, fit }` for the panel. A hook that throws has its wrapper removed, so
the panel is left with the model row.

For such a mode the attach, replies, browser and tools rows are hidden: they
mean nothing to a mode that runs its own turn (a roleplay). The definition's
`gearKeep` (any of `'attach'`, `'choices'`, `'browser'`, `'tools'`) names the
ones it still wants. A mode without `renderGear`, and plain chat, get every
row as before.

`chat.css` adds `.cm-gear-field` for a mode's labelled row (a label with a select or a text input).
