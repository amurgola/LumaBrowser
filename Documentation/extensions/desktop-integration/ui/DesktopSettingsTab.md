# DesktopSettingsTab

`extensions/desktop-integration/ui/DesktopSettingsTab.js`

The Desktop Integration settings tab (Settings > Extensions > Desktop
Integration), built from the design system's field, card, switch and badge
classes:

- the base URL of the local API;
- the desktop token, masked, with Show, Copy and Rotate (after a confirm);
- the handshake file path and whether it is written;
- one card per feature module with its label, id, description and an on/off
  switch, generated from the registry, plus a card for every feature folder
  that failed to load or start; a feature with a `settingsSchema` gets a
  folded "Settings" section whose fields save on change through
  `setFeatureSetting`;
- the desktop clients seen since launch (name, version, last seen, request
  count, features used).

Reloads on `ext.desktop-integration.changed`. Talks to
[DesktopIpcHandlers](../DesktopIpcHandlers.md).

## Methods

- `activate(context)`: registers the tab through `slotManager.register('settings-tab', ...)` and loads.
- `deactivate()`.
