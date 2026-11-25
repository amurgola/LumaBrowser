# ScreenStream

`extensions/android/device/ScreenStream.js`

Mirrors a device's screen through the scrcpy server and injects input over its control channel.

## Methods

- `start()`: pushes the server to `DEVICE_PATH`, starts it (no audio, `maxSize` 0 so the picture is the display's own size, 8 Mbit/s, 60 fps) and reads the video. `stop()`.
- Events: `configuration` `{ codec, width, height, data }` (the WebCodecs codec string and the visible size, read from the SPS) on every new picture size; `frame` `{ keyframe, ptsMicros, data }`; `ended`; `log`.
- `touch(action, x, y)` in pixels of the video frame; `key(action, code, metaState)` with a Tango key name (an unknown one does nothing); `pressKey(code)`; `text(text)`; `scroll(x, y, deltaX, deltaY)`.
- `requestKeyframe()`: for a viewer that joins late.
