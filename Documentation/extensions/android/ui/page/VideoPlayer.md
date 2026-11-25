# VideoPlayer

`extensions/android/ui/page/VideoPlayer.js`

Decodes a device's H.264 stream with WebCodecs and paints each frame on a canvas.

## Methods

- `configure({ codec, width, height })` starts a fresh decoder; `setConfigurationBytes(bytes)` keeps the SPS and PPS, which go in front of every key frame (the stream is Annex B); `decode(frame)` waits for a key frame first.
- `onFirstFrame`: called once per configuration, when the first frame has been painted.
