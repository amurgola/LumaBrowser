# SherpaWorkerProcess

`core/tts-server/runtimes/SherpaWorkerProcess.js`

Supervises one resident sherpa-onnx `utilityProcess` worker: fork, the
init/ready handshake, crash detection and stop. Everything else the worker says
goes to the owner.

## Methods

- `new SherpaWorkerProcess({ workerPath, serviceName, label, readyTimeoutMs, onMessage?, onExit?, onStderr?, fork? })`.
  `fork(path, args, options)` defaults to Electron's `utilityProcess.fork`,
  required lazily. `label` (for example `TTS`) builds the messages below.
- `start({ env, initConfig, timeoutMessage })` forks with
  `{ serviceName, stdio: 'pipe', env }`, posts `{ type: 'init', config }` and
  resolves the worker's `{ type: 'ready', ... }` message. Rejects on
  `init-error` (text, else `<label> init failed`), on exit, or after
  `readyTimeoutMs` with `timeoutMessage`; init errors and timeouts also stop the
  worker.
- `post(message)` throws when there is no worker; `tryPost(message)` drops it.
- `stop()` posts `{ type: 'shutdown' }` and waits for the exit, killing the
  worker after `STOP_GRACE_MS` (3 s).
- Getters: `state` (`idle | starting | ready | stopping | error`), `lastError`,
  `running`.
- Callbacks: `onMessage(message)` for every well-formed message other than
  `ready` / `init-error`; `onExit(err)` on every exit, with
  `<label> worker exited unexpectedly (code=<n>).` (also stored as `lastError`,
  state `error`) when nobody asked, else `lastError` or `<label> worker exited.`;
  `onStderr(text)` for non-blank stderr. stdout is read and dropped.

## Why

The worker is released before it is asked to exit, so the exit handler can tell
a deliberate stop from a crash. stdout is drained because a piped stream nobody
reads can fill and stall the child, and onnxruntime is chatty at load. The kill
after a grace period keeps a wedged native call from blocking a stop.

Users: TtsServerService and `SherpaSttBackend` (core/whisper-server/sherpa,
label `STT`).
