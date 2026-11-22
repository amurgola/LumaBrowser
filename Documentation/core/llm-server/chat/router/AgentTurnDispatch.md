# AgentTurnDispatch

`core/llm-server/chat/router/AgentTurnDispatch.js`

Routes a Tools-on chat turn through the agent bridge.

## Methods

- `new AgentTurnDispatch({ agentBridge, chatStore, getAgentDeps, policy, contextWindow })`.
- `run({ modelRef, messages, temperature, convId, asstId, userMessageId, hooks, modeTurn, images, llmExtra, choicesOn, voiceOn, docsGrant, evalOverrides, approvalOverride, runApprovals, modelBudget })` (`userMessageId` reaches the bridge for the sent-form record, and an optional `userText`, the user's own words, for its tool-group heuristics; prior turns go to the bridge as native messages unless an eval's `nativeHistory` says otherwise) returns `agentBridge.run(...)`'s handle. Options sent: `priorMessages` (persisted rows minus the placeholder), `allowTakeover: !evalOverrides`, `systemRole` ([ChatAssistantText](../ChatAssistantText.md)`.ROLE_TOOLS` outside a chat mode, so the run is the chat assistant and not a browser agent; null for a mode, which writes its own role), `modeSystemPrompt` (mode prompt, the documentation note when there is a [DocsSourceGrant](DocsSourceGrant.md), the plan note, outside a mode the chat assistant's `<answering>` block (`ChatAssistantText.toolsAnswering()`: when a request needs no tool, when it needs one, and how to answer), `WIDGETS` when there is no mode and no voice, `CHOICES`, `VOICE` joined by blank lines, or null), `turnReminder` (`VOICE_REMINDER` on voice turns, else null), `stepReminder`, `finalCheck` and watched `hooks` (see Plans below), `images`, `allowedTools` and `refreshAllowedTools` (an eval task list or a mode pin, with no refresh; else the policy, refreshable; a restricted list or a mode pin admits the turn's session tools, `search_lumabrowser_docs` and `update_plan`, on refresh too: `_admitting`), `extraTools` (the mode's session tools, then the grant's documentation search tool, then `update_plan`, then the background-task tools; null when there are none), `awaitsLaterResult` (see Background tasks below), `noBrowser`, `pinnedTabId` (`workTabId`, 0 included), `agentBudget` (the mode's, then the model's Tune knobs (`modelBudget`: `maxParallelToolCalls`, `userTimeoutMs`, `userMaxIterations`), then an eval `parallel > 1`, each layer winning over the one before; null when none says anything), `kbScope`, `ctxPerSlot`, `llmExtra`, `nativeHistory`, `nativeToolsOverride` (`'off'` only), `systemPromptOverride` (undefined outside an eval), `promptExperiments`, `approvalOverride`, `approvedTools` (a copy of `granted`, else null), `onRunApproval` (`onGranted`, else null) and `onRunApprovalUsed` (`onUsed`, else null), all from `runApprovals` (a delegated sub-conversation) or, without it, from [ConversationGrants](../approval/ConversationGrants.md)`.runApprovals()` for the conversation, so a chat keeps "Allow desktop control" across turns (none for an eval run, which answers no approvals, or without `convId`).
- `static requireDeps(getAgentDeps)`: the deps, or throws `NOT_READY` while `browserService` or `artifactStore` is missing.

## Why

The wire history is stripped to role and content, so an edit_image follow-up needs the persisted rows to find artifact ids. Only the user's policy may be refreshed mid-run; a mode's pin and an eval's task list are exact.

## Background work at the prompt tail

`turnReminder` is built by `_turnReminder(voiceOn, runningJobs)`: the voice style note and
the [ConversationJobReminder](../jobs/ConversationJobReminder.md) line for the jobs
`ConversationJobs.activeFor(convId)` returns, joined by a newline, or null when neither
applies. The jobs of kind `background-task` are left out (`_otherJobs`): the model's own
background tasks have their own line, asked on every step (below). The constructor takes
`jobs` and `tasks` ([BackgroundTasks](../tasks/BackgroundTasks.md)) as test seams.

## Background tasks

`BackgroundTaskTools.forTurn(turn, { tasks, jobs })`
([BackgroundTaskTools](../tasks/BackgroundTaskTools.md)) returns the tools for a plain
chat turn with a conversation id, and null for a mode turn or an eval run. When it does:

- `run_in_background`, `background_task_status` and `stop_background_task` join
  `extraTools` after the documentation tool and `update_plan`, and are admitted to a
  restricted allow-list the same way;
- its note joins `modeSystemPrompt` after the plan note;
- `stepReminder` (`_stepReminder(planTool, taskTools)`) asks the plan's reminder and the
  tasks' `tail()` on every request and joins what they say with a blank line, or null
  when both are silent; null outright when the turn has neither;
- `stepNotices` is `() => taskTools.endedNotices()`: a task that ends while the reply is
  still being written hands its result over at the run's next request. `slowCalls` is
  `taskTools.slowCalls` ([SlowCallBudget](../tasks/SlowCallBudget.md)): a direct call
  still going after a few seconds goes on as a background task. Both are null for a turn
  without the task tools.
- `awaitsLaterResult` is `() => taskTools.awaitsLaterResult`, true once the turn started
  a task, so the bridge's [FinalAnswerGate](../../agent/FinalAnswerGate.md) does not
  nudge a reply that ends with "I will tell you when it is done".

## Plans

`PlanTool.forTurn(chatStore, turn)` ([PlanTool](../plan/PlanTool.md)) decides whether the
turn plans (plain chat, or a mode turn with `planning: true`; never an eval). When it
does:

- `beginTurn(hooks)` retires a plan finished by the last request;
- `update_plan` joins `extraTools` and the allow-list, and its note joins
  `modeSystemPrompt` after the documentation note;
- `stepReminder` is `() => planTool.reminder()`. Unlike `turnReminder`, a string fixed
  for the turn, the bridge asks it again on every request, because the plan moves
  while the run works through it;
- `finalCheck` is `() => planTool.beforeFinalAnswer()`, which holds the final answer
  back once while steps before the last are open;
- the bridge gets `planTool.watching(hooks)`, so a reply that reaches its final answer
  completes the plan's last step before `done`.

Without a plan tool these are null and the hooks are passed through untouched.

## Pre-approved tools

A mode turn may carry `preApprovedTools` (tool names). They are added to the grants the run starts with (`approvedTools`), beside any carried in through `runApprovals` or the conversation's family grants, so the approval gate lets those calls through without a card. The one user is the Scheduled Task setup form ([SetupFormConsent](../scheduled-task/SetupFormConsent.md)). With neither source the value stays null.
