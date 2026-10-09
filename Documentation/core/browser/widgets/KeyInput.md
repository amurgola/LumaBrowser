# KeyInput

`core/browser/widgets/KeyInput.js`

Trusted keyboard and drag input for the widget primitives. Mouse clicks are
[InputDriver](../InputDriver.md); this covers keys (a slider's arrows, a masked
date field's digits, Escape) and press-move-release drags.

## Methods

- `KeyInput.trustedKey(wc, keyCode, modifiers = [])`: keyDown, keyUp, 10 ms
  apart. `keyCode` uses Electron accelerator names (`Right`, `Home`, `PageUp`,
  `Escape`, `Backspace`, `A`).
- `KeyInput.trustedType(wc, text)`: per character keyDown, `char` (what
  inserts text in Chromium), keyUp, 12 ms apart, so masks acting on
  keydown/keypress see every stroke.
- `KeyInput.trustedClearField(wc, platform = process.platform)`: select all
  (Cmd on macOS, Ctrl elsewhere), then Backspace.
- `KeyInput.trustedDrag(wc, from, to, { steps = 8 })`: move, press, `steps`
  moves carrying `leftButtonDown` (pages that read `buttons` during
  pointermove treat it as a drag), release. Points are viewport CSS px,
  converted with `InputDriver.toDip`.
- `KeyInput.sleep(ms)`.

All input goes through `webContents.sendInputEvent`, so pages see
`isTrusted: true` events with the browser's own default actions.
