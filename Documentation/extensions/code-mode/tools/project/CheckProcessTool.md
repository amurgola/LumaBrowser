# CheckProcessTool

`extensions/code-mode/tools/project/CheckProcessTool.js`

`check_process { pid, action?: 'status'|'tail'|'kill', tail_bytes? }` (a
[CodeTool](../CodeTool.md), `mutating: false`: it only reaches processes the
agent's run_command started).

## Behaviour

- Unknown pid: "No background process with pid N was started by run_command in this session."
- Each result opens with `pid N: <command> · running for <d> | exited with code N after <d> | killed after <d>`.
- `kill`: `DetachedProcesses.kill` (tree, best effort); `success` mirrors it, with the reason on failure.
- `tail`: `DetachedProcesses.tail(pid, tail_bytes)` tail-truncated, with the log
  path and size; `(log is empty so far)` when empty.
- `status` (default): running flag, exit code and log path.
