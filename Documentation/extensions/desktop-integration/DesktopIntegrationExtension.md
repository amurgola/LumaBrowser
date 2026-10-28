# DesktopIntegrationExtension

`extensions/desktop-integration/DesktopIntegrationExtension.js`

Main-process side of Desktop Integration, the local `/api/desktop` API for
desktop clients (see the [README](README.md) for the client and feature
contract). Builds the [DesktopToken](DesktopToken.md), the
[ClientRegistry](ClientRegistry.md), the shared services
([ChatHandoff](shared/ChatHandoff.md), [Speech](shared/Speech.md),
[AppWindows](shared/AppWindows.md)), the [DesktopHandshake](DesktopHandshake.md)
and the [FeatureRegistry](FeatureRegistry.md) over the modules
[FeatureCatalog](FeatureCatalog.md) finds in `features/`; registers
[DesktopIpcHandlers](DesktopIpcHandlers.md).

## Methods

- `new DesktopIntegrationExtension(overrides?)`: test overrides `{ featuresDir,
  handshakePath, version, broadcast, handoff, speech, windows, random, now }`.
- `activate(context)`: builds the parts, discovers and starts the enabled
  features, registers IPC, resolves the public API. The handshake is not
  written yet: the port is only known once `routes.js` runs.
- `deactivate()`: disposes every feature, stops speech, removes the handshake
  file if it still holds our token.
- `getApi()`: the public API, or null while inactive.

## Public API

`info()` (what the settings tab shows: `{ token, handshakePath,
handshakeWritten, port, apiBase, baseUrl, version, features, failed, clients }`),
`hello()`, `rotateToken()` (rewrites the handshake), `listFeatures()`,
`setFeatureEnabled(id, enabled)` (persists, starts or disposes, rewrites the
handshake, emits `features.changed`), `setFeatureSetting(id, key, value)`
(one settingsSchema value), `listClients()`, `clearClients()`,
`setGatewayPort(port)` (called by `routes.js`; writes the handshake),
`handshakePath()`, `desktopToken()`, `clientRegistry()`, `featureRegistry()`,
and the shared `handoff`, `speech`, `windows` objects.

## Entry files

- `manifest.js`: id `desktop-integration`, name Desktop Integration; required
  `core:database` whose tables are collected from every
  `features/<id>/tables.js` (so a feature never edits the manifest); optional
  `core:browser`, `core:llm-service`, `ext:personal-hub`,
  `ext:notification-interceptor`, `ext:timed-tasks`, `ext:ai-chat` (handed to
  features as `deps.extensions`); a settings tab registered by the renderer
  (`ui['settings-tab']`); `routes` at `/api/desktop`.
- `main.js`: `{ activate, deactivate, getApi }` over one instance.
- `routes.js`: reports `context.gateway.port` to `setGatewayPort` (the
  handshake is written from here) and mounts [DesktopRoutes](DesktopRoutes.md).
- `renderer.js`: sets `window.__ext_desktop_integration` over
  [ui/DesktopRenderer](ui/DesktopRenderer.md).

## Notes

- The REST gateway must be on (Settings > API) for routes, and so the
  handshake, to exist.
- `/api` is already behind ApiSecurity (network origin rules and an optional
  API key); the desktop token is checked in addition.

## Shortcuts and the X11 bridge

`_buildParts` makes one [X11Bridge](features/hotkeys/X11Bridge.md) for the
whole extension (`X11Bridge.forSession`: a Linux Wayland session with
XWayland, else null) and one [GlobalShortcuts](shared/GlobalShortcuts.md)
over Electron's `globalShortcut` (null outside Electron) and that bridge.
Both reach features as `deps.bridge` and `deps.shortcuts`; the hotkeys feature
starts and stops the bridge, every feature registers its keys on
`deps.shortcuts`, and `deactivate` disposes the shortcuts and stops the
bridge. Tests override both (`bridge`, `shortcuts`).
