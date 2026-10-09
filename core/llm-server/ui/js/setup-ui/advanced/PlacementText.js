import ByteFormatter from '../../format/ByteFormatter.js';

export default class PlacementText {
  static gb(bytes) {
    return bytes == null ? 'n/a' : ByteFormatter.gb(bytes);
  }

  static shortName(name) {
    return String(name || '').replace(/NVIDIA GeForce /, '');
  }
}
