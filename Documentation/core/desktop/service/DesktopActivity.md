# DesktopActivity

`core/desktop/service/DesktopActivity.js`

What desktop control is doing right now, for whoever wants to show it: one
event when an action starts, one when it ends. [DesktopService](../DesktopService.md)
emits them around every acting call (`click`, `type`, `pressKey`, `scroll`,
`drag`, `setValue`, `focus`, `launch`); the desktop-integration
[RunPresence](../../../extensions/desktop-integration/features/agent-run/RunPresence.md)
paints them on the activity ring and island.

## Methods

- `subscribe(listener)` -> unsubscribe. `listener(event)` with
  `{ phase: 'start' | 'end', action, hwnd, title, args }`, an `end` adding
  `success`, `code` (null when fine) and `error`. A throwing listener never
  affects the action. `listening` says whether anyone subscribed.
- `static describe(action, w, args)` the event body: `hwnd` and `title` from
  the resolved window (null for `launch`), `args` only the keys in `ARG_KEYS`
  (enough for a one-line description, never a screenshot).
- `start(info)`, `end(info, r)`.
