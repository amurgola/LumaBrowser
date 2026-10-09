class LlamaBuildNumber {
  static parse(version) {
    if (!version) return null;
    const match = String(version).match(/b(\d+)/i);
    return match ? Number(match[1]) : null;
  }
}

module.exports = LlamaBuildNumber;
