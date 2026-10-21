class ProtobufFields {
  static WIRE_VARINT = 0;
  static WIRE_FIXED64 = 1;
  static WIRE_BYTES = 2;
  static WIRE_FIXED32 = 5;

  static read(buffer) {
    const fields = [];
    let offset = 0;
    while (offset < buffer.length) {
      const key = ProtobufFields._varint(buffer, offset);
      offset = key.next;
      const field = ProtobufFields._value(buffer, offset, key.value & 0x7);
      fields.push({ number: Math.floor(key.value / 8), wireType: key.value & 0x7, value: field.value });
      offset = field.next;
    }
    return fields;
  }

  static bytesOf(buffer, number) {
    return ProtobufFields.read(buffer)
      .filter((f) => f.number === number && f.wireType === ProtobufFields.WIRE_BYTES)
      .map((f) => f.value);
  }

  static _value(buffer, offset, wireType) {
    switch (wireType) {
      case ProtobufFields.WIRE_VARINT:
        return ProtobufFields._varint(buffer, offset);
      case ProtobufFields.WIRE_FIXED64:
        return ProtobufFields._slice(buffer, offset, 8);
      case ProtobufFields.WIRE_FIXED32:
        return ProtobufFields._slice(buffer, offset, 4);
      case ProtobufFields.WIRE_BYTES: {
        const length = ProtobufFields._varint(buffer, offset);
        return ProtobufFields._slice(buffer, length.next, length.value);
      }
      default:
        throw new Error(`Unsupported protobuf wire type ${wireType}`);
    }
  }

  static _varint(buffer, offset) {
    let value = 0;
    let scale = 1;
    let next = offset;
    for (;;) {
      if (next >= buffer.length) throw new Error('Truncated protobuf varint');
      const byte = buffer[next++];
      value += (byte & 0x7f) * scale;
      if (byte < 0x80) return { value, next };
      scale *= 128;
    }
  }

  static _slice(buffer, offset, length) {
    const end = offset + length;
    if (end > buffer.length) throw new Error('Truncated protobuf field');
    return { value: buffer.subarray(offset, end), next: end };
  }
}

module.exports = ProtobufFields;
