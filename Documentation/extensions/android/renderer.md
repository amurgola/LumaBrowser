# renderer

`extensions/android/renderer.js`

Renderer side of the Android add-on (main browser window): the Android settings tab. One classic script with no
imports, since the shell loads a `distributable` add-on's renderer as a classic script and injects it inline when
the add-on is installed by the user. It registers `window.__ext_android` (`activate`, `deactivate`, plus the two
classes for the unit tests, which load the script into a DOM).

## Classes

- `AndroidSettingsTab`: `activate(context)` registers a settings tab of its own (`placement: 'tab'`, so Android
  has its entry in the Settings list: devices are opened from there, which is more than a setting), reads the
  overview and shows it; it is read again whenever the tab is opened and every 2 s while a device is starting.
  Every setting saves as it changes (`ext.android.saveSettings`). Device buttons call `open`, `start`, `stop`;
  New device calls `create`. `AndroidSettingsTab.sdkLine(sdk)`: where the SDK is, or what is missing.
- `DeviceRows`: `render(devices, sdk)` draws one card per device, built with `textContent` (names come from files
  on disk); an empty list says how to get a device. `DeviceRows.describe(device)`: "Android 36.1, Google Play.
  Running". `DeviceRows.actionsFor(state)`: Open always (opening starts the device), Start when stopped, Stop
  when running.
