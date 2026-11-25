# DeviceLink

`extensions/android/device/DeviceLink.js`

One adb connection to a device through the local adb server (127.0.0.1:5037).

## Methods

- `DeviceLink.connect(serial, tango)`.
- `shell(command)` -> text with plain line ends; `shellBytes(command)` -> a Buffer (a screenshot); `close()`.
- `adb`: the Tango connection the screen stream runs on.
