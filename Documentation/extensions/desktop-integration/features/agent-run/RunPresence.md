# RunPresence

`extensions/desktop-integration/features/agent-run/RunPresence.js`

The desktop run on the activity overlay ([ActivityOverlay](../../shared/ActivityOverlay.md)):
while the agent acts in another app the ring frames the window and the island
says what is being done, with Pause and Stop; paused, it says so and what is
waiting, with Continue; stopped, it says so and goes. Fed by
[DesktopActivity](../../../../core/desktop/service/DesktopActivity.md) (one
event per action) and [DesktopRunControl](../../../../core/desktop/service/DesktopRunControl.md)
(pause, resume, stop, waiting). Off (a no-op) without the overlay or with the
`showRun` setting off.

## Methods

- `new RunPresence({ overlay, options, onAction, onChange, log?, setTimeout?, clearTimeout? })`:
  `options()` -> `{ show, ring }`; `onAction(id)` for the island's `pause`,
  `resume` and `stop`; `onChange(snapshot)` after every change.
- `attach(desktop)` subscribes to `desktop.activity` and `desktop.control`
  -> detach; `detach()`.
- `live` (an island is up, or paused), `paused`, `snapshot`
  (`{ live, paused, step, window, action, waiting, progress }`).
- `onProgress(p)`: a [RunProgress](../../../../core/llm-server/chat/bridge/turn/RunProgress.md)
  object; a run in progress puts `Step <iteration> of <maxIterations>` and the
  elapsed seconds on the detail line (`Step 7 of 24 · 42 s · in Notepad`),
  refreshed every `TICK_MS` (1 s) while the island is up and not paused; a
  `done` one drops the counter (the line then says `Action <n> · in <title>`).
- `onActivity(event)`: a `start` opens or updates a `busy` island framed on the
  window (`title` the [ActionSentence](ActionSentence.md), `detail`
  the step line above, actions `CONTROLS`); an `end` marks the step done and
  starts the idle timer (`IDLE_MS`, 6 s), shows the error (`ERROR_MS`) when it
  failed, or Stopped on code `STOPPED`. A whole-desktop action's end conceals
  the overlay until the next start, so the agent's whole-screen screenshot
  does not contain it.
- `onControl(event, detail)`: `pause` and `waiting` paint Paused (`detail` the
  action waiting, actions `PAUSED_CONTROLS`, ring dimmed), `resume` paints
  Continuing, `stop` paints Stopped (`kind: 'done'`) and closes after `DONE_MS`.
- `showStopped()`: the same, from the feature's Stop.
- `dispose()`.
- `static clip(text, max)`.
