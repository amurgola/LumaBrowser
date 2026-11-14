# SetupFormConsent

`core/llm-server/chat/scheduled-task/SetupFormConsent.js`

Decides when a submitted setup form stands in for the approval card of `create_scheduled_task`.

Filling in the Scheduled Task form and pressing "Start task setup" is the user asking for that task. Before
2026-11-14 the create call still waited on an approval card inside the turn's step list: a user who did not notice
it within the two minute approval timeout got no task and no clear reason (the turn ended after about 129 s with
nothing created). The form now counts as the go-ahead for that one call.

The consent is deliberately narrow:

- only the first turn of a conversation: exactly one user message, which starts with `(Setup form submitted)`
  (what [ScheduledTaskForm](../../ui/js/tasks/ScheduledTaskForm.md)`.openingTurn` writes);
- only while the conversation has no task yet;
- only `create_scheduled_task`. Changing the task (`update_scheduled_task`), running it now
  (`run_scheduled_task`), a setup that went through questions in chat, and a task described by typing instead of
  the form all still show the approval card.

The user is told at each end, without relying on the model:

- before: the form's own text says that starting setup creates the task with no separate approval step;
- after: the create step's card stays open in the chat with the tool's own summary, `Created "<name>", runs
  <interval>` ([ToolChainView](../../ui/js/chat/turns/ToolChainView.md) `KEPT_OPEN`), the chat is renamed to
  the task and the task appears under Scheduled in the sidebar. The setup prompt also requires the reply to quote
  the run prompt as stored ([ScheduledTaskPrompt](ScheduledTaskPrompt.md)).

## Methods

- `SetupFormConsent.preApprovedTools(messages, existingTask)`: `['create_scheduled_task']` for the turn that
  answers the form, else `[]`. Read by [ScheduledTaskMode](../ScheduledTaskMode.md)`.buildTurn`, whose
  `preApprovedTools` [AgentTurnDispatch](../router/AgentTurnDispatch.md) adds to the grants the run starts with.
- `SetupFormConsent.OPENER`, `SetupFormConsent.TOOLS`.
