# InheritedDebugEnv

`core/terminal/shells/InheritedDebugEnv.js`

Takes an IDE's debugger out of an environment the app inherited. An app started from a debug run configuration
carries the debugger's preload in `NODE_OPTIONS` (WebStorm: `--require ...\nodeDebugInitializer\debugConnector.js`
plus `JB_IDE_HOST` / `JB_IDE_PORT`; VS Code: its js-debug `bootloader.js` plus `VSCODE_INSPECTOR_OPTIONS`). Every Node
process and worker thread started with that environment waits for the IDE.

That broke the terminal outright: node-pty reads a Windows pseudoterminal's output on a worker thread, the thread
never came up, and after five seconds the library reported an exit with code -1 and no process. The dock showed
"Process exited with code -1" the moment it opened, but only when the app had been started by the IDE's debugger.

- `forOwnProcess(env)`: for the terminal host process. No `NODE_OPTIONS` at all, and none of the debugger's variables.
  [TerminalHostClient](../TerminalHostClient.md) applies it when it forks the host.
- `forUserShell(env)`: for the user's shells. The debugger's preload and every `--inspect` flag go, so `node`, the
  luma CLI or a coding agent run in a terminal is not debugged by the IDE; the user's own options
  (`--max-old-space-size`, their own `--require`) stay. [ShellLaunch](ShellLaunch.md) applies it.

## Methods

- Statics: `forOwnProcess(env)`, `forUserShell(env)`, `withoutDebugger(nodeOptions)`.
