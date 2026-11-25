# DeviceViewer

`extensions/android/web/DeviceViewer.js`

One device page connected to one device.

## Methods

- `attach()`: greets the page (`hello` with the device and whether to fit), sends the current picture and asks the device for a key frame.
- Frames go out from a key frame on; a new configuration waits for one again; past 4 MB of unsent data the page is skipped ahead to a fresh key frame.
- `receive(text)`: `touch`, `key`, `text`, `scroll`, `button`, and `resize` (only while fitting is on). Anything else is ignored.
- `detach()` on socket close; the socket is closed when the device goes.
