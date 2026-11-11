# EmptyReplyRetry

`core/llm-server/chat/router/EmptyReplyRetry.js`

Sends a plain chat request again when its reply came back with no visible
text. A reasoning model now and then drafts its whole answer inside its
reasoning and stops there; the plain path then ended the turn as a blank
bubble, and a chat mode's reaction had nothing to read. The Tools-on path
already re-asks after an empty reply ([FinalAnswerGate](../../agent/FinalAnswerGate.md));
this is the same for the plain path, used by
[ChatTurn](ChatTurn.md)`._dispatchPlain`.

## Methods

- `new EmptyReplyRetry({ send, hooks, isFinished, maxRetries })`: `send(hooks)`
  dispatches the request once with the given hooks and returns its handle (or
  a promise of it); `hooks` are the turn's own; `isFinished()` is true once
  the turn was closed from outside (Stop, a superseding turn); `maxRetries`
  defaults to `MAX_RETRIES` (2).
- `start()`: dispatches the first attempt and resolves `{ abort }` for the
  whole exchange. A first dispatch that throws rejects, as the bare dispatch
  did.
- `abort()`: stops the attempt in flight; nothing is re-sent after it.
- `retries`: how many times the request was sent again.

## Rules

- Every hook passes straight through; only `onDone` is held back. A reply
  counts as answered once a delta with non-whitespace text arrived.
- Re-sent only when the reply finished on its own with no text: never after
  an abort, an outside close, the retry bound, or a native tool call (whose
  content is empty by design).
- Between two attempts' reasoning, `REASONING_BREAK` (a blank line) goes to
  `onReasoningDelta`, so the shown thought stream does not run them together.
- A re-send that throws reaches the turn's `onError`.

## Why

Measured 2026-11-11 on Qwen3.8-27B (reasoning effort low) in the roleplay
Lab: none in about 80 narrator turns with the story state in the system
prompt, 1 in about 40 with it in the newest message (see
[NarratorContext](../../../../extensions/roleplay-mode/prompts/NarratorContext.md)),
each ending the scripted run. The request is unchanged on a retry, so a local
server re-reads nothing, and a different sample almost always answers.
