# PacketCodec

`extensions/android/web/PacketCodec.js`

The binary frame the video socket carries to the device page: one byte for the kind (0 configuration, 1 key frame, 2 delta), the presentation time and the send time as two doubles, then the H.264 bytes. `ui/page/DeviceConnection.js` reads the same layout.

## Methods

- `PacketCodec.frame(frame, sentAtMs)`, `PacketCodec.configuration(configuration, sentAtMs)`, `PacketCodec.encode(kind, ptsMicros, sentAtMs, data)`.
