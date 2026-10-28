# KWinHintTarget

`extensions/desktop-integration/features/hotkeys/KWinHintTarget.js`

The window the shortcut hint is aimed at on a KDE Wayland session, with
[HintTarget](HintTarget.md)'s shape (`framed`, `supported`, `begin`, `end`,
`poll`), fed by [KWinWindows](../../shared/KWinWindows.md) instead of a
pointer hit test.

- `KWinHintTarget.forSession({ windows?, ownPid? })`: null without KWin.
- `begin()` starts the activation watch; the report marked `initial` (the
  window active when the hint showed) is no pick. A later activation frames that window
  (`poll()` returns its id once), the desktop returns 0 (the whole monitor),
  Luma's own windows (`ownPid`) and the same window again are no change.
  `end()` stops the watch and clears the frame.
- `frameOf(id)`, `titleOf(id)`: from the watcher, for the overlay's frame and
  the "Working on <title>" caption.

[HotkeysFeature](HotkeysFeature.md) uses it when `parts.hintTarget` is set
(its `defaultParts` asks `forSession`); the overlay's `frameFor` reads the
same watcher through the extension.
