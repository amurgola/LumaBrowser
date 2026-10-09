# AppProcess

`cli/lib/connect/AppProcess.js`

Starts LumaBrowser as a detached process that outlives the CLI.

## Methods (static)

- `AppProcess.launch(executable, args?, { platform?, env?, spawnFn? })`: spawns with
  `stdio: 'ignore'`, `detached: true`, the environment minus `ELECTRON_RUN_AS_NODE`, and unrefs the
  child. A macOS `.app` bundle goes through `open -a <bundle> --args ...`. Returns the child.

## Why

Under the `luma` launcher this process runs with `ELECTRON_RUN_AS_NODE=1`; the app must not inherit
it, or it would come up as a bare Node.
