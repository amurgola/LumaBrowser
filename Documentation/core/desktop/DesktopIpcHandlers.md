# DesktopIpcHandlers

`core/desktop/DesktopIpcHandlers.js`

IPC controller for the user's desktop-control opt-in (LLM tab, Visual
grounding card). Off by default, because it lets an agent click and type in
other applications.

## Methods

- `new DesktopIpcHandlers(desktopService)`.
- `register()` registers:
  - `core.desktop.getState` -> `{ success: true, supported: desktopService.supported, enabled: desktopService.isEnabled() }`
  - `core.desktop.setEnabled(on)` -> `desktopService.setEnabled(!!on)`, replies `{ success: true, enabled }`
- `DesktopIpcHandlers.CHANNELS` the channel names.

Not enveloped, matching legacy: neither call is expected to throw.
