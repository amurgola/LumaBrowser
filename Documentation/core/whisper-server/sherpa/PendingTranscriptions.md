# PendingTranscriptions

`core/whisper-server/sherpa/PendingTranscriptions.js`

The in-flight transcribe requests of the sherpa STT worker, each with its own timeout.

## Methods

- `nextId()` mints `stt-1`, `stt-2`, ...
- `add(id, { resolve, reject, timeoutMs, onTimeout? })` tracks a request; on
  timeout it is forgotten, rejected with `transcription timed out`, then
  `onTimeout()` runs.
- `resolve(id, value)` / `reject(id, err)` settle once and clear the timer;
  return false for an unknown or already settled id.
- `rejectAll(err)` settles every request (worker crash).
- `size` is the in-flight count (gates idle unload).
