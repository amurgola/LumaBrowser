# QuitController

`core/shell/QuitController.js`

Drives an orderly quit under a timeout and, when cleanup hangs, asks the user
whether to keep the app open, retry, or force quit.

## Methods

- `new QuitController(host)` where `host` is:
  - `cleanup()`: async orderly shutdown of everything the app owns
  - `exit(code)`: `app.exit`
  - `showDialog(opts)`: `dialog.showMessageBox`, resolving `{ response }`
  - `killChildren()`: best-effort kill of tracked children, returns killed pids
  - `canPrompt()` (optional): false in headless, docker or no-window runs
  - `timeoutMs` (optional, default 5000), `log` (optional, default `console`),
    `setTimeout` (optional, for tests)
- `requestQuit()` runs one quit attempt and resolves `'exited'`,
  `'kept-open'` or `'already-quitting'`. The caller has already called
  `event.preventDefault()` on `before-quit`.
- `markSystemShutdown()` marks the quit as OS-driven: no dialog.
- `isQuitting` (getter) is true while a quit attempt is running.
- `QuitController.DIALOG`, `KEEP_OPEN` (0), `RETRY` (1), `FORCE` (2): the
  dialog options and its button indices.

## Behaviour

- Cleanup finishes (or throws) in time: `exit(0)`.
- Cleanup times out and nobody can answer (OS shutdown or `canPrompt()` false):
  kill children, `exit(0)`.
- Otherwise the dialog is shown. Keep open cancels the quit and keeps ownership
  of the children. Retry runs cleanup again under the same timeout. Force quit
  (or a dialog that throws) kills children and `exit(1)`.

## Why

The old path force-exited after the timeout and could orphan llama-server,
sd-server and friends with their VRAM still allocated. OS shutdown and headless
runs keep the old best-effort exit because nobody is there to answer and Windows
will not wait.
