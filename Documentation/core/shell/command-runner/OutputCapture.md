# OutputCapture

`core/shell/command-runner/OutputCapture.js`

Merged stdout+stderr of one command.

## Methods

- `new OutputCapture({ maxBytes, spillDir, onOutput })`.
- `push(data)` counts the bytes, tells `onOutput` (a throwing observer is ignored),
  keeps the most recent `maxBytes` in memory, and once the total passes `maxBytes`
  writes every byte (including those already held) to a spill file
  `<spillDir>/luma-cmd-<time>-<pid>-<random>.log`. Nothing is lost, just relocated.
- `detach()` opens the spill file now, whatever the size (a detached process needs
  a log from its first byte); returns its path, or null when the disk refused.
- `snapshot()` `{ text, totalBytes, capturedBytes, spillPath }` without closing.
  After trimming, the partial first line is dropped so the model never sees a torn line.
- `finish()` closes the spill file and returns the snapshot.

A disk error while spilling keeps the in-memory tail.
