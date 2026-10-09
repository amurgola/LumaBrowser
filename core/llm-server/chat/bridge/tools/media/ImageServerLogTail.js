const BridgeGlobals = require('../../BridgeGlobals');

class ImageServerLogTail {
  static MAX_LINES = 6;

  static append(baseMessage) {
    try {
      const tail = ImageServerLogTail._recentStderr(BridgeGlobals.imageServerService());
      return tail.length ? `${baseMessage}\nsd-server log:\n${tail.join('\n')}` : baseMessage;
    } catch (_) {
      return baseMessage;
    }
  }

  static _recentStderr(svc) {
    if (!svc) return [];
    const logs = [];
    for (const server of [svc.editRuntimeServer, svc.runtimeServer].filter(Boolean)) {
      try {
        const lines = server.getStatus && server.getStatus().logs;
        if (Array.isArray(lines)) logs.push(...lines);
      } catch (_) {}
    }
    return logs
      .filter((l) => l && l.stream === 'stderr' && l.line && l.line.trim())
      .sort((a, b) => (a.ts || 0) - (b.ts || 0))
      .slice(-ImageServerLogTail.MAX_LINES)
      .map((l) => l.line.trim());
  }
}

module.exports = ImageServerLogTail;
