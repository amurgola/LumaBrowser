# TriggerMode

`core/llm-server/chat/TriggerMode.js`

The core `trigger` chat mode: a conversation that defines, tests, arms and later
edits one trigger, an agent run in reaction to an inbound event (webhook, file,
page change or browser notification), stored in [TriggerStore](TriggerStore.md).
Registered in [ChatModeRegistry](ChatModeRegistry.md) at boot (core mode, no
owning extension).

## Methods

- `new TriggerMode({ triggerStore, emitEvent?, registry?, getRunner?, getFileWatch?,
  getPageSource?, getSecrets?, getArtifactStore?, getChatStore?, getHookBaseUrls?,
  getAgentManager?, getNotificationSource? })`. Throws `TriggerMode requires a
  triggerStore`. The `get*` options are late-bound getters that may return null
  or throw ([TriggerModeServices](trigger-mode/TriggerModeServices.md));
  `getHookBaseUrls()` returns `{ local?, lan?, public? }` base URLs the hooks
  router is reachable on. `registry` defaults to `ChatModeRegistry.shared`;
  `emitEvent(type, payload)` receives `triggers-changed`.
- `register()` registers `descriptor()` and returns the mode; `unregister()` removes it.
- `descriptor()`: `{ id: 'trigger', label: 'Trigger', icon (U+26A1), description,
  requirements: ['llm'], launcher: 'sidebar', agent: true, buildTurn }`.
- `buildTurn({ conversationId })` returns `{ systemPrompt, temperature: 0.3,
  agent: true, tools, allowedTools, noBrowser: true }`. The prompt is
  [TriggerModePrompt](trigger-mode/TriggerModePrompt.md) built from the
  conversation's trigger, the runner's `describeRunTools(conversationId)`, the
  hook base URLs and [TriggerPromptExtras](trigger-mode/TriggerPromptExtras.md).
  The tools are [TriggerTools](trigger-mode/TriggerTools.md) and
  `allowedTools` pins the turn to exactly them.

## The arming flow

1. `create_trigger`: the trigger exists (webhook URL, watched folder, bound
   monitor or notification scope), unarmed, awaiting a sample.
2. A sample: the first real event is captured, not run
   ([WebhookSource](triggers/WebhookSource.md) and the other sources do this), or
   the model calls `set_sample`.
3. `test_trigger` runs the sample for real; a passing test vouches for the
   current configuration, and only then can `update_trigger enabled=true` arm it.

The store hashes the configuration, so any later prompt edit disarms the trigger
until it is re-tested: a stale test never vouches for new instructions.

## Why

Like [ScheduledTaskMode](ScheduledTaskMode.md), the setup conversation stays the
trigger's live config: its model pill and gear-panel tools are what every run
uses (the runner reads them per run), and the same tool list is spelled out in
the prompt so the model writes run prompts that name real tools. The setup tools
are session-scoped and never available to the runs.
