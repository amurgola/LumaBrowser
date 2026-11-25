# AndroidSettings

`extensions/android/settings/AndroidSettings.js`

The Android extension's stored settings, under the one key `settings` of its namespace.

## Methods

- `read()`; `save(patch)` -> the settings after the save. Unknown keys, values of the wrong kind and an unknown graphics mode are dropped.
- Defaults: `sdkPath` `''` (find it), `gpuMode` `host` (or `swiftshader_indirect`, the processor), `fitToFrame` on, `relayNotifications` on, `agentAccess` on, `stopOnQuit` on.
