# NotificationWatcher

`extensions/android/device/NotificationWatcher.js`

Watches a device's notifications over adb shell, with no app installed on the device.

## Methods

- `start()`: one silent poll (what is already there is known but not announced), then one every 2 s. `stop()`.
- `list()`; events `posted` (the notification) and `removed` (its key).
- One poll at a time; a poll of an idle device costs 10 to 33 ms.

## Why

On Android 16 `cmd notification list` and `get` answer title and text to the shell user, and plain `dumpsys notification` redacts them. Android 15 and later hide one-time codes from untrusted notification listeners; the shell path is not a listener.
