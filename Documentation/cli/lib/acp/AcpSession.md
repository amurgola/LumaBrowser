# AcpSession

`cli/lib/acp/AcpSession.js`

One ACP session over one bridge socket into a Code-mode conversation
([TerminalSession](../../../extensions/code-mode/terminal/TerminalSession.md)).

## Methods

- `new AcpSession({ ws, rpc, cwd, agent?, approval?, client?, log? })`: a connected
  [WsClient](../connect/WsClient.md), the [JsonRpcStdio](JsonRpcStdio.md) to the
  editor, the project folder, a LumaBrowser agent name (null for Code), `'ask'` or
  `'never'`, and the editor's name (the conversation's `client` is `acp/<name>`).
- `open({ conversationId? })`: `hello { cwd, agent, conversationId, approval: ..., suggest: false, origin: 'ide', client }`;
  resolves `ready`. The conversation id becomes `id`. A bridge error, or a resume
  the bridge could not honour (`ready.resumeMissed`), rejects with a `JsonRpcError`.
- `loadAgents()`: `list-agents` for the config option.
- `configOptions()`: one select option `agent` (category `_agent`): `code` plus
  every stored agent, `currentValue` the agent `ready` named.
- `setConfigOption('agent', value)`: a second hello on the same conversation
  re-pins it on that agent (the history stays); refused during a turn.
- `replayHistory()`: `history` -> `user_message_chunk` / `agent_message_chunk`
  per stored message; returns the count.
- `prompt(blocks)`: one turn; resolves `{ stopReason }` (`end_turn`, `max_tokens`
  for a length finish, `cancelled`) or rejects with the bridge's `error`, `busy` or
  `bridge-error` message. Refused while a turn runs, after the socket closed, or
  with nothing to send.
- `cancel()`: `abort`; the aborted `done` ends the turn as `cancelled`.
- `close()`, `busy`, `onClosed(session)` (set by the agent to drop the session).
- Statics `decisionOf(result)`, `stopReasonOf(payload, turn)`, `bridgeError(err)`.

## Frames in a turn

`delta` through a [RollbackBuffer](../RollbackBuffer.md) (`rollback` retracts a
call's streamed text; the buffer is flushed before any card and at the end) as
`agent_message_chunk`; `reasoning-delta` as `agent_thought_chunk`; `tool` through
[AcpToolCards](AcpToolCards.md): an `approval` phase sends the pending card and a
`session/request_permission` whose answer (option id, or `reject` for cancelled or
failed) is `approve { decision }`; `command:output` and `agent` update their cards;
`done` closes any open card and resolves; `error`, `busy` and `bridge-error`
reject. The socket closing mid-turn rejects with `LumaBrowser closed the connection`.
