# InputEventMapper

`extensions/tab-share/InputEventMapper.js`

Expands a parsed viewer message into `webContents.sendInputEvent` payloads.
Coordinates arrive normalised to the streamed frame, which is the whole view,
so normalised point x view DIP size is exactly what Electron expects; the
viewer never needs the host's zoom or device pixel ratio.

## Methods

- `InputEventMapper.toInputEvents(msg, view)` -> `[{ event, delay? }]`
  (`delay` is a pause before that event):
  - mouse: one `mouseMove`, `mouseDown` or `mouseUp`.
  - click: `mouseMove`, then per click count a `mouseDown` and `mouseUp`
    (clickCount 1, 2) each after 20 ms.
  - wheel: one `mouseWheel` with both deltas negated (DOM down-positive,
    Chromium up-positive), `canScroll: true`.
  - key: `keyDown`, `keyUp` (10 ms) with modifiers; a bare printable key (not
    in `KEY_MAP`, no Ctrl/Alt/Meta) also gets a `char` between them.
  - text: per character `keyDown`, `char`, `keyUp` (8 ms); `\n` or `\r` is a
    Return press.
  - anything else (ping, nav, rtc, null): `[]`.
- `InputEventMapper.toViewPoint(nx, ny, view)` -> rounded `{ x, y }` (a
  missing view counts as 1x1).
- `InputEventMapper.electronKeyCode(key)`: `KEY_MAP` name, a single character
  itself, else null.
