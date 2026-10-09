class SysdepsLinkerParser {
  static LDCONFIG_ENTRY = /^\s*(\S+)\s+\(/;
  static LDD_NOT_FOUND = /^\s*(\S+)\s*=>\s*not found/i;

  static parseLdconfig(stdout) {
    return new Set(SysdepsLinkerParser._captureEach(stdout, SysdepsLinkerParser.LDCONFIG_ENTRY));
  }

  static parseLddNotFound(stdout) {
    return Array.from(new Set(SysdepsLinkerParser._captureEach(stdout, SysdepsLinkerParser.LDD_NOT_FOUND)));
  }

  static _captureEach(stdout, pattern) {
    const captured = [];
    for (const line of String(stdout || '').split(/\r?\n/)) {
      const match = line.match(pattern);
      if (match) captured.push(match[1]);
    }
    return captured;
  }
}

module.exports = SysdepsLinkerParser;
