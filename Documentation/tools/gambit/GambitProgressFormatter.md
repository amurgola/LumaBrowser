# GambitProgressFormatter

`tools/gambit/GambitProgressFormatter.js`

Turns one `core.llmServer.gambitEvent` into the stderr progress line of `run-gambit`.

## Methods

- `GambitProgressFormatter.line(evt)`: `resolved` -> `suite: N tasks; web reachable|UNREACHABLE (web tasks will
  skip)`; `progress` `result` -> `  NN%  group/task`; `progress` `skip` -> `  skip  group/task (reason)`; `server`
  -> the starting or state line; `error` -> `ERROR: message`; anything else null.
