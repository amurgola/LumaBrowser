class RemoteDeviceRef {
  static PATTERN = /^r:(.+):(\d+)$/;

  static isRef(value) {
    return typeof value === 'string' && RemoteDeviceRef.PATTERN.test(value);
  }

  static parse(value) {
    const match = typeof value === 'string' ? value.match(RemoteDeviceRef.PATTERN) : null;
    return match ? { peerId: match[1], index: Number(match[2]) } : null;
  }

  static format(peerId, index) {
    return `r:${peerId}:${index}`;
  }
}

module.exports = RemoteDeviceRef;
