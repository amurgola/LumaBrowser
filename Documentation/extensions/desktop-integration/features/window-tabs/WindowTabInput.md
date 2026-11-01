# WindowTabInput

`extensions/desktop-integration/features/window-tabs/WindowTabInput.js`

Input a window tab's page passes through to its window, sent as real input
through desktop control ([DesktopService](../../../../core/desktop/DesktopService.md)),
so the same gate, refusals, Pause and Stop apply as to the agent's own desktop
actions, and the window comes to the front for each one (SendInput needs it).
Points arrive as fractions of the window's picture (0..1 across and down) and
map to physical screen pixels from the window's live rect.

## Methods

- `new WindowTabInput({ getDesktop, probe, allowed })`: `getDesktop()` the
  DesktopService or null; `probe` a [WindowProbe](../lumabyte/WindowProbe.md)
  (its `rect`); `allowed()` the feature's `control` setting.
- `status()` -> `{ allowed, reason }`: the setting, a missing service, or the
  service's gate (desktop control off, not Windows).
- `handle(hwnd, event)` -> the desktop action's result, or `{ success: false, error, code }`
  (`NO_CONTROL`, `NOT_FOUND` when the window has no rect). Events:
  - `{ type: 'click', nx, ny, button?, double? }` -> `desktop.click({ hwnd, sx, sy, button, double, source: 'user' })`
    (`left`, `right` or `middle`; anything else is left);
  - `{ type: 'wheel', nx, ny, direction, amount }` -> `desktop.scroll` with
    `amount` 1..`MAX_NOTCHES` (10) and `down` for an unknown direction;
  - `{ type: 'text', text }` -> `desktop.type({ mode: 'keys' })`, at most
    `MAX_TEXT` (2000) characters;
  - `{ type: 'keys', keys }` -> `desktop.pressKey` (combos as
    [DesktopKeys](../../../../core/desktop/DesktopKeys.md) reads them).
- `static point(rect, nx, ny)` -> `{ sx, sy }` clamped inside the rect.

`source: 'user'` marks these as a person's actions: [RunPresence](../agent-run/RunPresence.md)
leaves them off the island.
