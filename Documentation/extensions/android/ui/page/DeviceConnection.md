# DeviceConnection

`extensions/android/ui/page/DeviceConnection.js`

The page's live link to one device.

## Methods

- `open()`: asks for a ticket, opens the socket and routes what arrives to `handlers.message`, `configurationBytes`, `frame` and `closed`.
- `send(message)`; `DeviceConnection.readPacket(buffer)` reads what [PacketCodec](../../web/PacketCodec.md) writes.
