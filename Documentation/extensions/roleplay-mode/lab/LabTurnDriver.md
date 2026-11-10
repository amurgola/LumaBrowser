# LabTurnDriver

`extensions/roleplay-mode/lab/LabTurnDriver.js`

Plays a roleplay conversation through the app's chat router exactly as the
chat page does, so the Lab measures the production request and the
production reaction instead of a re-assembled copy of them.

## Methods

- `new LabTurnDriver({ router, descriptor, modelRef, turnTimeoutMs, reactionTimeoutMs })`:
  `router` is the chat router (`chat`, `chatStore`, `observeDispatch`,
  `resolveModelRef`); `descriptor` the roleplay mode (its `choices` flag sets
  the page's "Suggest replies" flag the way `ModeLauncher` does); `modelRef`
  the story model, or null for the router's current one.
- `open(data)` creates a hidden conversation in the `roleplay` mode with the
  scenario as its meta (`createConversation` + `setMeta`, as
  `ModeLauncher._createConversation` does) and returns its id.
- `play(userText)` sends one player line as a chat turn: the thread the page
  would send (`context`: the store's active variants, empty placeholders
  dropped) plus the line, the page's turn flags (`turnFlags`: tools off,
  choices per the mode, no thinking override, no documentation source) and
  `nested` so the Lab never supersedes a user's turn. It waits for the
  stream's terminal (`done` or `error`), then for the mode's world update
  (`mode:reaction` from the router, or earlier `mode:world`, a stopped or
  failed `mode:activity`, or `mode:progress { done }`), each bounded. Resolves
  `{ messageId, assistant, reasoning, request, calls, ms, aborted }`:
  `request` is the narrator call as dispatched (`{ modelRef, messages,
  temperature, extra }`, read from the dispatcher through
  `router.observeDispatch`), `calls` every model call the turn made
  (`[{ kind, at }]`, kind from the trace and the side-call prompts:
  `narrator`, `stage`, `profile`, `consolidate`, `pressure`, `polish`, `judge`).
- `data()` the stored story state; `close({ keep })` deletes the conversation
  unless `keep`.
- `LabTurnDriver.turnFlags(descriptor)`, `context(messages)`, `kindOf(request)`;
  `LabTurnDriver.TurnWaiter` (the event collector).

## Why

The old text run called `buildTurn` and `postProcess` itself and shaped the
request with its own copy of the router's rules. Everything the router adds
for a user (the reply-choice document, the thinking dial, the model's Tune
overrides, the real window, the conversation path and timeline over the
store) was missing, so a run that passed said nothing about the app. Now the
only Lab-specific code is the driver, and it drives the router.
