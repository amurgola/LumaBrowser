# TurnRecorder

`core/network-sharing/webapp/public/js/shim/TurnRecorder.js`

Collects what one streamed web turn produced and shapes it for the assistant
message, in the desktop's `toolCalls: { tools, artifacts }` shape so a reloaded
web turn renders exactly like the desktop chat.

## Methods

- `addReasoning(text)`; fields `reasoning`, `tools`, `artifacts`.
- `record(type, payload)`: `tool` events push `{ tool, params, status: 'run' }`
  on `run` and close the latest open step of that tool on `done`
  (`status: ok|err`, `error`, `summary`). `artifact` events (with an id) get
  `payload.url` rewritten to [ArtifactViewUrl](ArtifactViewUrl.md) (in place, so
  the chat sees it) and are recorded with `rootId`/`version` when present and
  `html`/`js`/`libs` for `live` modules; returns the id to cache, else `null`.
- `messagePatch(content, usage)`: `{ content, reasoning }`, plus `toolCalls`
  when anything ran and `tokensIn`/`tokensOut` (OpenAI or Anthropic usage names).
