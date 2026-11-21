# AppProcess

`cli/lib/connect/AppProcess.js`

Starts LumaBrowser as a detached process that outlives the CLI.

## Methods (static)

- `AppProcess.launch(executable, args?, { platform?, env?, spawnFn? })`: spawns with
  `stdio: 'ignore'`, `detached: true`, the environment minus `CALLER_ONLY_VARIABLES`, and unrefs the
  child. A macOS `.app` bundle goes through `open -a <bundle> --args ...`. Returns the child.
- `AppProcess.CALLER_ONLY_VARIABLES`: `ELECTRON_RUN_AS_NODE` and `__COMPAT_LAYER`, the variables that
  describe the caller and must not reach the app.

## Why

Under the `luma` launcher this process runs with `ELECTRON_RUN_AS_NODE=1`; the app must not inherit
it, or it would come up as a bare Node.

`__COMPAT_LAYER` is how Windows passes a program's compatibility mode to everything it starts. A
caller running in a compatibility mode (found with a terminal tool set to Windows 8 mode) would hand
it to the app: Electron then believes it is on an older Windows, and the main window's rounded
corners end up outside the page, so it looks square. Dropping the variable from the child's
environment is enough, even when the caller still has it.
