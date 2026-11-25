# TangoModules

`extensions/android/device/TangoModules.js`

Loads Tango, the adb and scrcpy client library, once. Its packages ship with the app and are ES modules, which the app's Node loads through `require`; they are found through [AppModules](../AppModules.md), and everything else receives them as plain objects, which tests replace with fakes.

## Methods

- `TangoModules.load(loadModule)` -> a Promise of `{ adb, nodeTcp, adbScrcpy, scrcpy, streams }`; `loadModule` defaults to `AppModules.load`.
