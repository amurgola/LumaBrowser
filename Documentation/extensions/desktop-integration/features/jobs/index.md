# jobs feature

`extensions/desktop-integration/features/jobs/index.js`

One aggregated view of Luma's long-running work, for desktop clients (REST and
Server-Sent Events) and for the main window's taskbar button. On by default.
Contract for clients: the Desktop Integration [README](../../README.md).

## The job object

```json
{
  "id": "model-download-mh2k3l0-7",
  "kind": "model-download",
  "title": "Downloading model: qwen3-8b-q4_k_m.gguf",
  "progress": 0.42,
  "state": "running",
  "startedAt": 1792764000000,
  "eta": 95,
  "cancellable": false,
  "detail": "Downloading",
  "source": "core.llmServer.modelEvent"
}
```

- `kind`: `chat`, `image`, `video`, `music`, `model-download`,
  `runtime-install`, `timed-task`, `app-update`.
- `progress`: 0..1, or `null` when the work reports none (indeterminate).
- `state`: `running`, `queued`, `done`, `failed`, `canceled`. (No source
  reports `queued` today: Luma runs one render per router and one download per
  slot, and a new one replaces the old.)
- `startedAt` / `finishedAt`: epoch milliseconds. `eta`: seconds left, when
  known. `error`: the failure message of a `failed` job. `detail`: a short
  phase ("Verifying", "Step 12 of 30", "Paused" on a paused download).
- Ids are unique for one run of the app; they do not survive a restart.

## Routes (token required)

- `GET /api/desktop/jobs/` -> `{ success, active: [job], recent: [job], aggregate }`.
  `active` oldest first; `recent` holds up to 20 jobs finished in the last 30
  minutes, newest first. `aggregate`: `{ running, queued, progress, indeterminate, eta }`
  where `progress` is the mean of the running jobs that report one (null when
  none does) and `eta` the longest known one.
- `GET /api/desktop/jobs/stream` -> `text/event-stream`. Events:
  `snapshot` (the `GET /` body without `aggregate`) first, then `job` (one job
  object) per change; progress-only changes are sent at most every 250 ms per
  job. A `: heartbeat <ms>` comment every 15 s. When the feature is switched off
  or the extension stops, every stream gets `event: end` (`{ reason: 'feature-stopped' }`)
  and is closed; a client reconnects later (the `retry:` hint is 5 s) and
  should re-read the handshake first.
- `POST /api/desktop/jobs/:id/cancel` -> `{ success: true, job }`. Only jobs with
  `cancellable: true` (chat replies, image, video and music renders); `409` for
  a job without a cancel path or already finished, `404` for an unknown id.

## Sources

Each is a small adapter in `sources/`:

| Source | What it watches | Cancel |
| --- | --- | --- |
| [ChatJobSource](sources/ChatJobSource.md) | the chat router's in-flight turn (`global.__lumaChatRouter.active`), polled each second | the chat's Stop (`router.abort()`) |
| [RenderJobSource](sources/RenderJobSource.md) | `generate()` of the image, video and music routers (wrapped on the instance) | the router's `abort()` |
| [TransferJobSource](sources/TransferJobSource.md) | model downloads and runtime installs through [SenderStream.observe](../../../../core/shared/ipc/SenderStream.md) | none (lives inside the IPC handlers) |
| [TimedTaskJobSource](sources/TimedTaskJobSource.md) | timed-tasks runs (`status: 'running'`), polled every 3 s | none |
| [AppUpdateJobSource](sources/AppUpdateJobSource.md) | electron-updater `download-progress` | none |

Not covered: fit tests, Gambit and placement benchmarks, eval runs, RAG
indexing, the music runtime's Python env build when it streams on another
channel, and anything a third-party extension runs.

## Taskbar

[TaskbarSurface](TaskbarSurface.md) draws the registry on the main window's
taskbar button with Electron's own APIs (no Windhawk): `setProgressBar`
(aggregate, indeterminate, red for a few seconds after a failure, cleared when
idle), `setOverlayIcon` (a dot badge) and `setThumbarButtons` ("Stop
generation", "Cancel: <job>"). Icons come from [TaskbarIcons](TaskbarIcons.md).

The main window minimizes to the tray (it hides), so while minimized there is
no taskbar button to draw on; the state shows again with the window.

## Settings (`settingsSchema`)

| Key | Type | Default | |
| --- | --- | --- | --- |
| `taskbarProgress` | bool | true | progress on the taskbar button |
| `taskbarIncludeChat` | bool | true | a streaming chat reply animates the taskbar (the API lists it either way; the Stop button stays) |
| `overlayBadge` | bool | true | Windows overlay dot |
| `thumbarButtons` | bool | true | Windows thumbnail toolbar buttons |
| `errorFlashSeconds` | number 0..60 | 4 | how long a failure shows red; 0 never |

`onSettingsChanged` re-renders the taskbar at once.

## For other features: `summary()`

`require('../jobs').summary()` -> `null` while the feature is off, else
`{ running, queued, progress, line }`, `line` being `'1 job running 42%: <title>'`,
`'3 jobs running 17%'` or null when idle. `aggregateOf(registry)` is the
`aggregate` of `GET /`.

## Files

- [JobRegistry](JobRegistry.md), [JobEventStream](JobEventStream.md),
  [TaskbarSurface](TaskbarSurface.md), [TaskbarIcons](TaskbarIcons.md)
- sources: [ChatJobSource](sources/ChatJobSource.md),
  [RenderJobSource](sources/RenderJobSource.md),
  [TransferJobSource](sources/TransferJobSource.md),
  [TimedTaskJobSource](sources/TimedTaskJobSource.md),
  [AppUpdateJobSource](sources/AppUpdateJobSource.md)

## Why no Windhawk mod

Electron already reaches every Windows surface this feature needs on Luma's
own taskbar button (progress, overlay, thumbnail buttons). The gap is the tray:
a minimized Luma has no taskbar button at all, and a mod cannot draw progress
on a button that does not exist. The fitting surface there is the tray icon
(tooltip or icon image), which Luma owns natively; it lives in
`app/window/AppTray.js`, outside this feature.
