# CommandText

`extensions/code-mode/tools/project/CommandText.js`

Wording shared by run_command and check_process.

## Methods (static)

- `head(command, n = 48)` clips with `…`.
- `duration(ms)` -> `1.5s`, `12s`, `2m 5s`.
- `exitCodeText(e)` -> the exit code, else the signal, else `'unknown'`.
- `exitNotice(e)` -> `[System: background process <pid> (<head>) finished (exit 0) | exited with code N | was killed after <duration>; log at <path or (no log)>]`,
  queued for the conversation and relayed by the agent loop.
