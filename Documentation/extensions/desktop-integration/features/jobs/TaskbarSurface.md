# TaskbarSurface

`extensions/desktop-integration/features/jobs/TaskbarSurface.js`

Shows the [JobRegistry](JobRegistry.md) on the main window's taskbar button
through Electron (works without Windhawk).

| Surface | API | Shows |
| --- | --- | --- |
| progress | `setProgressBar` | `normal` with the aggregate progress (at least 1%), `indeterminate` when no running job reports progress, `error` for `errorSeconds` after a job fails, removed (`-1`) when idle |
| overlay (Windows) | `setOverlayIcon` | a dot while jobs run ("2 LumaBrowser jobs running"), red after a failure, none when idle |
| thumbar (Windows) | `setThumbarButtons` | "Stop generation" while a chat reply streams; "Cancel: <title>" for the newest other cancellable job. A click runs `registry.cancel(id)` |

- Constructor: `{ registry, getWindow, options, nativeImage, platform, now, setTimeout, clearTimeout }`.
  `options()` is read on every render: `{ progress, overlay, thumbar, includeChat, errorSeconds }`.
  With `includeChat` off, chat jobs do not count for progress, overlay or the
  failure flash, but the Stop button still appears.
- `start()` subscribes to the registry and renders; `schedule()` coalesces
  bursts (150 ms); `render()` applies the state; only changed values reach the
  window. A new main window (renderer recovery) is picked up on the next render
  and the old one cleared.
- The overlay and the thumbnail toolbar are never set just to be empty
  (Windows keeps a toolbar once one exists; an empty list clears its buttons).
- `dispose()` stops listening and clears progress, overlay and buttons.
- `progressState(agg, failing)`, `overlayState(agg, failing)`: the pure
  decisions, exported for tests.

Every native call is guarded: a missing method or a throw never breaks the
feature. While Luma is minimized to the tray the window has no taskbar button;
the state is kept on the window and appears when it is shown.
