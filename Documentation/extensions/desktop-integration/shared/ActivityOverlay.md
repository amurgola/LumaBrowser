# ActivityOverlay

`extensions/desktop-integration/shared/ActivityOverlay.js`

The desktop activity overlay features show while Luma acts outside its window
(`deps.overlay`). Two windows on one monitor:

- the **ring**: a full-display, click-through (`setIgnoreMouseEvents`) light
  along the monitor's edges, brightest at the top center;
- the **island**: a pill at the top center of the monitor's work area with
  the activity's mark, title, detail, quick actions and progress.

Both are frameless, transparent, `focusable: false` and shown with
`showInactive()`, so clicking the island never takes focus from the app the
user is in. They are created on first use, reused (hidden between activities)
and destroyed by `dispose()`. The pages are [ActivityPages](ActivityPages.md);
the main process drives them with `executeJavaScript` and gets clicks back as
one `window.__island.next()` promise per click (no preload, no IPC channel).

One activity at a time: a new `show()` replaces the current one. A **peek**
(the shortcut hint, [ChordHint](../features/hotkeys/ChordHint.md)) lays over
whatever is showing: the session keeps running and updating underneath, unseen,
and `unpeek()` paints it back (or retracts when there is none). One click loop
per island window routes each click to what is on screen: the peek, else the
current session. Paints are serialized, so a fast update never lands before the
first paint. A peek can frame one window (`state.frame`, a window handle): the
ring window takes the window's rect plus `ActivityPages.RING_PAD` on every
side, and the island sits at the window's top center (kept inside the work
area of the display the window is mostly on). A second peek replaces the first in place, without reopening the island;
a new frame bumps the ring's `lock`, which replays its ignition.

## Methods

- `new ActivityOverlay({ electron?, displayFor?, frameFor?, log?, tokensCss? })`:
  `frameFor(hwnd)` returns a window's DIP rect (the extension passes one built
  on `Win32Windows.windowRect` and `screen.screenToDipRect`).
  `displayFor(hwnd)` returns the Electron display a window is on (the
  extension passes one built on `Win32Windows.windowRect`); without a window or
  a match, the cursor's display is used. `tokensCss` defaults to Luma's
  `core/llm-server/ui/css/tokens.css`, inlined into both pages.
- `show(state, onAction?)` -> `{ id, update(patch), close({ after? }) }`.
  `state`: `{ kind: 'speech' | 'busy' | 'done' | 'error', title, detail,
  actions: [{ id, label, icon: 'pause' | 'play' | 'stop' | 'open' | 'close', primary? }],
  progress (0..1 or null), paused, ring (default true), island (default
  true), hwnd }`. `onAction(id)` runs for a click while the session is current.
- `update(patch)` repaints (an update with `ring: false` turns the ring off);
  false once closed or replaced.
- `close({ after })` retracts at once, or after `after` ms (a "Done" moment);
  the windows hide `EXIT_MS` later.
- `peek(state, onAction?)`: shows `state` over the current session (on the
  window's monitor when `state.hwnd` is given, else the session's, else the
  cursor's); a second peek replaces it. `state.frame`: a window to wrap;
  `state.caption`: the line under a `keys` island. `unpeek()` -> false when nothing was
  peeking. `peeking`.
- `frameOf(hwnd)`: the DIP rect the overlay would frame (null without one).
- `conceal()`: hides both windows at once for a screen capture; returns
  `restore()`, which paints the current peek or session again.
- `active`: the current session id or null. `dispose()`.

Ring modes: `live` (breathing, while speaking), `paused` (dimmed, still),
`busy` (light travelling along the top), `armed` (kind `keys`: a spark at the
top center, light sweeping down both sides to meet at the bottom in about
0.5 s, then the edge pulses with its bloom breathing against it while two
comets orbit the edge; framed on a window, the same with a crisp outline and an
outer glow). All motion is off under
`prefers-reduced-motion`.
