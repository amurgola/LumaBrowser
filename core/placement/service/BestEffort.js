class BestEffort {
  static read(fn) {
    try { return fn(); } catch (_) { return null; }
  }
}

module.exports = BestEffort;
