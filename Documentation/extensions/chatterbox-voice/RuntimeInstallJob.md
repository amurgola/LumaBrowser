# RuntimeInstallJob

`extensions/chatterbox-voice/RuntimeInstallJob.js`

One background audio.cpp install started from the Setup tab.

## Methods

- `new RuntimeInstallJob({ id, runtimesRoot, stopEngine, onInstalled, installer? })`
  (`installer` defaults to a new [AudioCppRuntimeInstaller](AudioCppRuntimeInstaller.md)).
- `start()` returns the job; `finished` resolves when it settles (never rejects).
  It stops the engine (ignoring failures), installs, calls `onInstalled(id)`.
- `state`: `{ id, phase, received, total, kind, done, error, startedAt }`;
  `phase` moves through `starting`, `resolved`, `download`, `extract`,
  `extracted`, `finalize`, then `done` or `error`. An error carries the
  releases URL in parentheses when the installer's detail has one.
