# DeviceSession

`extensions/android/device/DeviceSession.js`

One running device as the rest of the extension uses it.

## Methods

- `DeviceSession.open({ name, serial, tango, serverJar })` builds the parts; `start()` turns auto-rotate off (with it on, the emulated sensor turns the screen straight back), reads the model and Android version, starts the stream, then the notification watcher. `stop()`.
- For viewers: `video`, `describe()`, `touch`, `key`, `text`, `scroll`, `requestKeyframe`, `fit`; events `configuration`, `frame`, `ended`, `posted`, `removed`.
- For tools, in screen pixels: `tap(x, y)`, `swipe({ fromX, fromY, toX, toY, durationMs })`, `typeText(text, { submit })`, `pressKey(name)` (false for a name outside `KEYS`), `listApps()`, `openApp(package)` (false when the device did not start it; a name that is not a package name never reaches the shell), `screenshot()` (PNG), `readScreen()`, `notifications()`.
