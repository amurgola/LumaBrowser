class PacketCodec {
  static CONFIGURATION = 0;
  static KEYFRAME = 1;
  static DELTA = 2;
  static HEADER_BYTES = 17;

  static encode(kind, ptsMicros, sentAtMs, data) {
    const packet = Buffer.allocUnsafe(PacketCodec.HEADER_BYTES + data.length);
    packet.writeUInt8(kind, 0);
    packet.writeDoubleBE(ptsMicros, 1);
    packet.writeDoubleBE(sentAtMs, 9);
    packet.set(data, PacketCodec.HEADER_BYTES);
    return packet;
  }

  static frame(frame, sentAtMs) {
    return PacketCodec.encode(frame.keyframe ? PacketCodec.KEYFRAME : PacketCodec.DELTA, frame.ptsMicros, sentAtMs, frame.data);
  }

  static configuration(configuration, sentAtMs) {
    return PacketCodec.encode(PacketCodec.CONFIGURATION, 0, sentAtMs, configuration.data);
  }
}

module.exports = PacketCodec;
