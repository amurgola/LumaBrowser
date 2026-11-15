# OutputWatch

`core/terminal/host/OutputWatch.js`

Waits for a terminal to reach a point worth reporting and settles once, on whichever comes first: `prompt` (when asked
for), `exit`, `pattern` (a predicate asked after output), `idle` (quiet for `idleMs`, when `idleAccept()` agrees),
`timeout`, or `cancelled`.

## Methods

- `new OutputWatch({ timeoutMs, untilPrompt, idleMs, idleAccept, matches }, timers)`, `promise`, getter `settled`.
- `onOutput()`, `onPrompt()`, `onExit()`, `cancel()`.
