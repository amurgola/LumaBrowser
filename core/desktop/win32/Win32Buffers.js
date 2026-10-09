class Win32Buffers {
  static readWide(buf, chars) {
    return buf.toString('utf16le', 0, Math.max(0, chars) * 2);
  }

  static readWideZ(buf) {
    const text = buf.toString('utf16le');
    const end = text.indexOf('\0');
    return end >= 0 ? text.slice(0, end) : text;
  }

  static rectFrom(buf) {
    const left = buf.readInt32LE(0);
    const top = buf.readInt32LE(4);
    return { x: left, y: top, width: buf.readInt32LE(8) - left, height: buf.readInt32LE(12) - top };
  }
}

module.exports = Win32Buffers;
