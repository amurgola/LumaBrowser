# ProtobufFields

`core/chrome-extensions/store/ProtobufFields.js`

Reads the top-level fields of a protobuf message: varints, length-delimited
bytes, and fixed 32/64-bit fields (skipped as raw bytes).

## Methods

- `ProtobufFields.read(buffer)` returns `[{ number, wireType, value }]` in wire
  order; `value` is a `Buffer` for bytes and fixed fields, a `Number` for
  varints (exact up to 2^53). Throws on truncation and on the deprecated group
  wire types.
- `ProtobufFields.bytesOf(buffer, number)` returns the bytes of every
  length-delimited field with that number.

## Why

Only [CrxArchive](CrxArchive.md) needs protobuf, for three fields of the CRX3
header; a full protobuf library would be a dependency for a few lines of
wire format.
