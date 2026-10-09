# LocalServerStarter

`core/llm-server/service/LocalServerStarter.js`

Makes sure the local llama-server runs for callers outside the chat (extension
slots, visual grounding), loading the vision projector on request.

## Methods

- `new LocalServerStarter({ service, runtimeServer, launcher, tracker, settleTimeoutMs = 5 min })`;
  `launcher.resolveAndStart(service, { withVision })` is ServerLauncher's;
  `tracker` is [LocalRequestTracker](LocalRequestTracker.md); `service.getDefaults()` is read.
- `ensureRunning({ withVision = false })` resolves `{ success, status?, error?, code? }`:
  1. waits out a vision restart in progress;
  2. `ready`: with `withVision` and an unloaded projector, restart with it;
     otherwise `markActive()` and `{ success: true, status }`;
  3. otherwise one shared start for all concurrent callers: wait for a
     `starting`/`stopping` server to settle (or time out), succeed if it became
     ready, refuse `NO_MODEL_ERROR` without a default runtime and model, else launch;
     a launcher throw becomes `{ success: false, error }`;
  4. after a successful start `markActive()`, and if a text-only start won the race
     for a vision caller, load the projector.
- `whenVisionSettled()` resolves once any vision restart settled (never rejects).
- `LocalServerStarter.needsVisionLoad(status)` the plan has `mmprojAvailable` but no `mmprojPath`.
- Vision restart: one at a time, shared by concurrent callers; refused with
  `{ success: false, code: 'LOCAL_BUSY', error: BUSY_ERROR }` while the tracker is
  busy; `ensureStopped()` (errors ignored), then launch with `withVision: true`,
  then `markActive()` on success.
- Statics: `SETTLE_TIMEOUT_MS`, `SETTLED_STATES`, `NO_MODEL_ERROR`, `BUSY_ERROR`.

## Why

A burst of slot requests must not spawn duplicate children, and
`runtimeServer.start()` throws unless idle or error. The projector is loaded on
demand and never unloaded for being idle, so text turns after it do not bounce
the server; the restart picks a new port, which is why it waits for a quiet server.
