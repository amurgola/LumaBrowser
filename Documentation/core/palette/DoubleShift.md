# DoubleShift

`core/palette/DoubleShift.js`

Spots a double tap of Shift (the JetBrains "Search Everywhere" gesture) in a
stream of Electron `before-input-event` inputs. A tap is a Shift press and
release with nothing else in between; two taps within `WINDOW_MS` (400 ms) fire on
the second press. One detector serves every keyboard hook, with state kept per
source key (`tab:<id>`, `shell:<windowId>`, `on-demand`).

## Methods

- `new DoubleShift({ now? })`: `now` is a clock seam for tests.
- `feed(source, input)`: true when this input completes a double tap. Never asks
  the caller to block the key, so Shift still reaches the page.
- `forget(source)`: drops a source's state (TabPageEvents calls it when a tab's
  contents are destroyed, so the map does not grow with every tab ever opened).
- `DoubleShift.shared`: the one instance every hook feeds
  ([TabPageEvents](../browser/tab-view/TabPageEvents.md),
  [WindowKeys](../../app/window/WindowKeys.md),
  [OnDemandKeyboard](../on-demand/OnDemandKeyboard.md)).
- `DoubleShift.enabled`: the process-wide switch; [PaletteService](PaletteService.md)
  sets it from the `core.palette.doubleShift` setting.
- `WINDOW_MS` (400), `MAX_HOLD_MS` (350).

## Why

Shift is typed constantly, so only a clean tap counts: any other key in between
(a capital letter, a chord), Ctrl, Alt or Meta held, a Shift held longer than
`MAX_HOLD_MS` and auto-repeat all reset the state. Detecting in main rather than
in each page means it works on any website without injecting script, and the one
shared instance keeps timing and the off switch identical everywhere.
