# RuntimeFixCard

`core/llm-server/ui/js/chat/turns/RuntimeFixCard.js`

A one-click fix under a turn that failed with `RUNTIME_NOT_INSTALLED`: download
the runtime with live progress (`api.onRuntimeEvent`), then regenerate the turn.
A runtime with no installable build gets a pointer to Advanced / Setup instead.

## Methods

- `create(message)`: `null` without that hint.
- `RuntimeFixCard.progressText(type, payload)`: the status line per install event.
