# WsFrameCodec

`cli/lib/connect/WsFrameCodec.js`

RFC 6455 framing for [WsClient](WsClient.md).

## Methods (static)

- `WsFrameCodec.encode(opcode, payload)`: one FIN frame, always masked (clients must mask), with the
  7-bit, 16-bit or 64-bit length form.
- `WsFrameCodec.decode(buf)`: `{ fin, opcode, payload, length }` for the frame at the head of `buf`
  (`length` is the bytes it used), unmasking if masked; `null` while incomplete.
- Opcodes: `CONTINUATION`, `TEXT`, `CLOSE`, `PING`, `PONG`.
