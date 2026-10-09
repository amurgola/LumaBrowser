# TurnStatus

`cli/lib/tui/session/TurnStatus.js`

What the status line says during a turn.

## Methods

- `new TurnStatus(now)`; fields `current` (`{ kind: 'working'|'thinking' }`, `{ text }`, or `null`
  for plain working) and `since`.
- `set(s)`: `since` restarts whenever the label changes. `clear()`: back to plain working.
  `reset()`: no status at all (between turns).
- `label(reasoning, dot)`: a fixed text as is; otherwise the kind, replaced by a canned long-wait
  thought after 20 s ([ToolGrammar](../ToolGrammar.md)`.longWaitText`), plus the thinking size
  (`thinking · 207 chars`).

## Why

Status is state, not copy: the label is built at render time, so a wait that drags on can change
what it says without a new frame from the host.
