class ContextOverflow {
  static PATTERN = /exceeds the available context|context size has been exceeded|maximum context length|context[_ ]window[_ ]exceeded|context length exceeded/;
  static COUNTS_PATTERN = /request \((\d+) tokens\) exceeds the available context size \((\d+) tokens\)/i;

  static isExceeded(error) {
    return ContextOverflow.PATTERN.test(String(error || '').toLowerCase());
  }

  static parseCounts(error) {
    const match = ContextOverflow.COUNTS_PATTERN.exec(String(error || ''));
    if (!match) return null;
    return { request: Number(match[1]), window: Number(match[2]) };
  }
}

module.exports = ContextOverflow;
