# VaultPlaceholders

`core/vault/VaultPlaceholders.js`

`{{vault:<name>}}` placeholders: how the assistant uses a saved API key without reading it. The model writes the
placeholder into a tool's arguments. The chat's ToolCallPipeline swaps in the value just before dispatch, after the
approval card (which shows the placeholder), and the chat history keeps the placeholder. The resolver deciding
whether a key may be used is installed at boot by FoundationServices: `VaultAgentAccess.resolveKeys`, which allows
only `send_webhook`, `send_notification_ntfy` and `run_command` and only keys marked for the assistant.

## Methods

- `VaultPlaceholders.install(resolver | null)`; resolver `(toolName, params, caller) -> { params } | { error }`.
- `namesIn(value)` lowercase names used anywhere in strings inside plain objects and arrays.
- `replace(value, values)` a deep copy with names replaced; the input is untouched.
- `resolveFor(toolName, params, caller)`: a call without placeholders passes as is.
