export default class ProgressPercent {
  static of(received, total) {
    return total > 0 ? Math.min(100, Math.floor((received / total) * 100)) : null;
  }
}
