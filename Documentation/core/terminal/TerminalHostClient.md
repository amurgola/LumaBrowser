# TerminalHostClient

`core/terminal/TerminalHostClient.js`

The main process's line to the terminal host process, an Electron utility process running
[TerminalHostWorker](host/TerminalHostWorker.md). The process starts with the first request, not with the app. Shells
live there so that heavy output cannot stall the browser and a crash in the native pseudoterminal module cannot take
it down.

The process is supervised by `SherpaWorkerProcess` (the same fork, ready handshake, crash detection and polite stop
the speech workers use). A worker that dies fails every waiting request with `HOST_GONE`, reports `{ type:
'host-exit' }` and is replaced on the next request.

## Methods

- `new TerminalHostClient({ onEvent, env, log, createProcess })`.
- `request(method, params)` -> the host's result, or rejects with its error.
- `post(method, params)`: one-way (keystrokes, resizes, acknowledgements); dropped while no host is running.
- `stop()`.

The host is forked with `InheritedDebugEnv.forOwnProcess(env)`: the app's environment as it is at that moment, without `NODE_OPTIONS`. An IDE debugger's preload there keeps node-pty's output thread from starting, and no terminal would ever open.
