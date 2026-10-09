# LiveTurnRegistry

`core/network-sharing/host/llm/LiveTurnRegistry.js`

In-flight LLM turns a client can stop by name through
`POST /sharing/llm/v1/chat/abort`. One per router.

## Methods

- `LiveTurnRegistry.turnIdOf(req)`: `X-Luma-Turn-Id`, else
  `X-Client-Request-Id`, else `body.turnId`, trimmed; null when empty or over 128 characters.
- `register(id, credential, cancel)`: returns an unregister function that only
  removes this record; a null id registers nothing.
- `abort(id, credential)`: true after removing the turn and running its cancel
  (errors swallowed); false for an unknown id, a finished turn or a different credential.

## Why

A client's socket close does not reliably reach the host through a reverse
proxy or keep-alive agent, and a runaway model would otherwise generate until
the context wall. Turns are scoped to the credential that started them (same
object or same token id), so one client can never stop another's; a miss
tells the caller nothing.
