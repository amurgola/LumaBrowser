# ChatTurnRequest

`core/llm-server/ipc/ChatTurnRequest.js`

One unified chat turn from the chat UI.

## Methods

- `ChatTurnRequest.run(chatRouter, args, send)` calls `chatRouter.chat` with `args`
  minus `context`, the messages run through
  `IdeContextFormatter.appendToLastUserMessage(messages, context)`, and `send`.
  A throw sends `error { message, ...hints }` and resolves `{ success: false, error, ...hints }`.
- `ChatTurnRequest.hintsOf(err)` `{ code, runtimeId, runtimeName, installable }`
  (nulls, and `installable: false` unless a boolean).

## Why

The Code surface's editor chips join the model-facing messages only; the stored
user message stays bare. The hints let the chat offer a fix (install the runtime)
instead of a bare error string.
