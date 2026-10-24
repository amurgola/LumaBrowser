# TransferJobSource

`extensions/desktop-integration/features/jobs/sources/TransferJobSource.js`

Model downloads and runtime installs. They all stream progress to the renderer
that started them through `core/shared/ipc/SenderStream`; this source observes
those messages with [SenderStream.observe](../../../../../core/shared/ipc/SenderStream.md)
(a main-process hook added for it) on a fixed list of channels:

| Channel | Kind | Job key |
| --- | --- | --- |
| `core.llmServer.modelEvent` | model-download | one (single download slot) |
| `core.llmServer.addonEvent` | model-download | add-on id |
| `core.llmServer.runtimeEvent` | runtime-install | runtime id |
| `core.imageServer.modelEvent` | model-download | one (single download slot) |
| `core.imageServer.runtimeEvent` | runtime-install | runtime id |
| `core.musicServer.modelEvent` | model-download | modelId |
| `core.musicServer.runtimeEvent` | runtime-install | runtime id |
| `core.voiceServer.event` | by scope (`*-runtime` is an install) | scope + id |
| `core.groundingServer.event` | model-download | id |

- The first message of a key starts a job (a lone trailing terminal message
  does not; a lone `error` records a failed job). `start` and `file-start` name
  it after `file`, `repoId` or `id`.
- `patchFor(type, payload)`: `download` (`received/total`, `etaMs`), `verify`
  (`read/total`), `extract` (indeterminate), `progress` (`percent` or
  `received/total` or `step/totalSteps`), `resume`.
- Terminal: `done`, `error` (failed), `canceled`, `paused` (canceled with detail
  "Paused") on model channels; `done`, `finalize`, `error`, `canceled` on
  runtime and voice channels. An add-on's nested `runtime` messages are ignored.
- A key silent for 5 minutes (`STALE_MS`, swept every 30 s) is finished as
  done ("No progress reported"), so a flow that ends without a terminal message
  never pins the taskbar.
- Not cancellable: the download slots' cancel lives inside the IPC handlers.

Limits: a multi-file image model reports per-file progress (the bar restarts
per file); chat, image, video and music generation channels are left to the
other sources.
