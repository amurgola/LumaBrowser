# UiaHostScript

`core/desktop/uia/UiaHostScript.js`

The PowerShell half of the UI Automation sidecar that UiaHost runs. Windows
ships the managed UIA client (UIAutomationClient.dll) with every PowerShell 5.1
install, so the accessibility tree is reachable with no native dependency. The
script is sent as `-EncodedCommand`, so nothing has to be unpacked from the asar.

## Members

- `UiaHostScript.SCRIPT` the script text (PowerShell with an embedded C# helper).

## Protocol

One JSON request per stdin line, one JSON reply per stdout line, matched by `id`.

- `{ id, cmd:'ping' }`
- `{ id, cmd:'tree', hwnd, maxNodes }` -> `{ id, ok, nodes:[{ref, role, name, rect, aid, enabled, patterns}], truncated }`
- `{ id, cmd:'act', ref, action, value }` -> `{ id, ok, done }` or `{ id, ok, needsPointer, rect, offscreen, scrolled }`;
  action is `click | setValue | focus | locate | setRange`
- `{ id, cmd:'wake', hwnd }` -> `{ id, ok, widgets, msaa }`
- `{ id, cmd:'hit', x, y, ref? }` -> `{ id, ok, name, role, rect, rid, pid, top, relation? }`
- unknown commands reply `{ ok: false, error: "unknown cmd <cmd>" }`

Refs are valid until the next `tree` call for any window.

## Chromium and Electron accessibility (the `wake` command)

- Chromium keeps its web-content accessibility tree off until an assistive
  technology shows up, because building it costs renderer CPU. Before that its
  UIA answer is the frame (title bar, menu bar) and an empty Document.
- What turns it on per process is a client asking for an accessibility object
  of the render widget: `WM_GETOBJECT` on the `Chrome_RenderWidgetHostHWND`
  child, with `OBJID_CLIENT` (MSAA, what NVDA and JAWS do) or `UiaRootObjectId`
  (UIA). The renderer then serializes the tree asynchronously, so the first
  `FindAll` after the trigger is still sparse. Hence: wake, tree, and if still
  sparse one delayed retry (DesktopService.observe).
- Asking the top-level `Chrome_WidgetWin_1` is not always enough (it answers for
  the views frame); the render widget child is the reliable target.
- The global switch (`SPI_SETSCREENREADER`) would also work, but it changes
  every app on the machine, so it is deliberately never used (a test pins this).
- `AccessibleObjectFromWindow` is used for the MSAA request rather than a raw
  `SendMessage`, because it consumes the LRESULT, so the object the app
  marshals is released instead of leaked.
- Chromium may turn accessibility back off after a quiet period, so the wake is
  repeated on every observe of a Chromium window (it is cheap).
