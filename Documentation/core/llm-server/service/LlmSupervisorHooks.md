# LlmSupervisorHooks

`core/llm-server/service/LlmSupervisorHooks.js`

Wires the chat model's supervisor to the things that follow its state.

## Methods

- `LlmSupervisorHooks.wire({ runtimeServer, vramCoordinator, releasePeers, vramWatchdog, runningCaps })`:
  - `vramCoordinator.releaseOnIdle` and `markResidentOnReady` under `'llm'`: free
    the VRAM claim when it stops, stop debiting it once it shows in nvidia-smi;
  - on `idle` or `error`: `releasePeers()` fire-and-forget (errors swallowed);
  - on `ready`: `vramWatchdog.start()`; on `idle`, `error` or `stopping`: `stop()`;
  - on `ready`: `runningCaps.rememberRunning()`.
  Each concern is its own `state-change` listener, so one failing never starves the others.
- Statics: `SERVER_ID`, `WATCHDOG_STOP_STATES`, `RELEASE_PEER_STATES`.

## Why

Borrowed peer GPUs go back when the run ends; the peer's lease TTL is the
backstop if the call is lost. The watchdog polls only while a model is resident,
so it costs nothing otherwise.
