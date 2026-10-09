# GambitConversation

`core/llm-server/gambit/GambitConversation.js`

Plays one gambit task's turns against the model as a single growing
conversation. Used by [GambitRunner](GambitRunner.md).

## Methods

- `new GambitConversation({ task, runTurn, emit, isAborted, progress, turnTimeoutMs })`
  where `progress` is the runner's `{ done, total }` at task start.
- `turns` getter: [Scorer](../eval/Scorer.md)`.normalizeTurns(task)`.
- `play()` resolves `{ transcripts, aborted }`. Each turn:
  1. stops with `aborted: true` when `isAborted()`;
  2. emits `{ phase: 'turn', done, total, taskId, group, turn, of }`;
  3. calls `runTurn({ task, turnIndex, prompt, priorMessages, timeoutMs })`
     with a copy of the conversation so far; a throw becomes
     `{ finalResponse: '', toolCalls: [], iterations: 0, error, health: { timedOut } }`
     (`timedOut` when the message says "timed out");
  4. appends `{ role: 'user', content: prompt }` and
     `{ role: 'assistant', content: finalResponse, toolCalls?: { artifacts } }`
     (`toolCalls` only when the turn made artifacts);
  5. stops after a transcript with an `error`.

## Why

A memory task is only meaningful if turn 3 can see turn 1, so the model sees
what it actually said. `toolCalls.artifacts` is what the chat bridge builds
its artifact catalog from; without it a later "edit that page" turn cannot
know the page exists and the task becomes unwinnable. A turn that died ends
the conversation, because later turns would be scored against a context the
model never saw.
