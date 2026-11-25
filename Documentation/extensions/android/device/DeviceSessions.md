# DeviceSessions

`extensions/android/device/DeviceSessions.js`

The sessions of the devices in use, one per device name.

## Methods

- `open(name)`: starts the device, connects and starts the session; callers that ask together share one opening, and a failed one is forgotten.
- `get(name)`, `names()`, `close(name)`, `closeAll()`.
- A session whose device went away is stopped and dropped. Event `posted(name, notification)` for every device.
