# WindowObserver

`core/desktop/service/WindowObserver.js`

Reads a window's interactive elements through UI Automation.

## Methods

- `new WindowObserver({ win, sleep })`.
- `read(uia, w, maxNodes = 150)` `{ nodes, truncated }`. For a Chromium or
  Electron window it first asks the sidecar to `wake` the web accessibility tree
  (a failed wake is ignored: the frame's own controls stay readable), and when the
  first answer is sparse (under 3 nodes, or ending in a `Document`) it reads once
  more after `CHROMIUM_RETRY_MS` (700): the renderer builds its tree
  asynchronously after the wake. A sparse native app is neither woken nor re-read.
- `isChromium(w)` class `Chrome_WidgetWin_*`, or an exe in `CHROMIUM_EXES`
  (Chrome, Edge, Brave, Opera, Vivaldi, Electron, VS Code, Slack, Discord, Teams,
  Spotify, Obsidian, Notion, Figma, WhatsApp, Signal).
- `WindowObserver.describe(w, nodes, truncated)` the text the agent reads:
  `WINDOW: <title> (hwnd <n>)`, `ELEMENTS (<n>[+, truncated]):` and one
  `[ref] Role "name"` line per node (names cut at 80, `(disabled)` marked), or the
  hint to use desktop_screenshot when there are none.
