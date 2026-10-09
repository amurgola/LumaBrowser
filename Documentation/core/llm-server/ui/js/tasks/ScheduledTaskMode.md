# ScheduledTaskMode

`core/llm-server/ui/js/tasks/ScheduledTaskMode.js`

Client hooks for the core `scheduled-task` chat mode (the server half is
core/llm-server/chat ScheduledTaskMode). The sidebar opens an inline setup form;
a submitted form becomes the first turn, so the model creates (and tests) the
task straight away.

## Methods

- `new ScheduledTaskMode(chatExt)`; `register()` (a no-op without a registry); `hooks()`.
- `hooks().openSetup(api, ctx)`: [ScheduledTaskForm](ScheduledTaskForm.md)
  inline in `ctx.setupHost()`, else as a modal; resolves the data or `null`.
- `hooks().startConversation(api, ctx, data)`: with a prompt,
  `ctx.sendTurn(ScheduledTaskForm.openingTurn(data))`; without (a programmatic
  launch), the canned `INTRO` is persisted with `api.conv.addMessage` as an
  assistant turn, then `ctx.refresh()`.

## Collaborators

`chatExt`: the [LumaChatExt](../chat-ext/LumaChatExt.md) instance. The LLM tab
entry calls `new ScheduledTaskMode(window.LumaChatExt).register()` after
`LumaChatExt.install` and before the chat shell loads modes (legacy: the script
loaded between chat-ext.js and chat-mode.js).
