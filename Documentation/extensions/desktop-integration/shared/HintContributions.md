# HintContributions

`extensions/desktop-integration/shared/HintContributions.js`

Keys other features add to the shortcut hint (`deps.hints`), so the keycaps the
island shows while Ctrl+Alt+Shift is held list every desktop shortcut, not
only the hotkeys feature's own.

- `add(featureId, provider)` -> `remove()`. `provider({ framed, hwnd })` returns
  `[{ id, accelerator, label, note?, disabled?, run(source) }]`; `framed` is the
  window picked on the hint (0 when none), `hwnd` the one in front when it
  showed.
- `entries(context)`: every valid entry, tagged `featureId`; a provider that
  throws contributes nothing (logged).
- `setHost({ dismiss, target })` -> `remove()`: the hotkeys feature, which draws
  the hint, says how to dismiss it and which window it is aimed at.
- `dismiss()`, `target()`: for a contributor whose own shortcut is pressed while
  the hint is up, so it acts on the picked window like a click would.

The [hotkeys feature](../features/hotkeys/HotkeysFeature.md) merges the entries
into the modifier groups (`ChordHint.split(accelerator)`) and runs `run({ via:
'hint', hwnd, frame })` when such a keycap is clicked.
