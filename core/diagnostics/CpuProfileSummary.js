const TraceEventLabel = require('./TraceEventLabel');
const TraceNumbers = require('./TraceNumbers');

class CpuProfileSummary {
  static TOP_FUNCTIONS = 20;
  static META_FRAMES = new Set(['(idle)', '(program)', '(root)']);

  static busy(profile) {
    if (!profile || !profile.nodes) return null;
    const idleIds = new Set(profile.nodes.filter((n) => n.callFrame.functionName === '(idle)').map((n) => n.id));
    let idle = 0;
    let total = 0;
    CpuProfileSummary._forEachSample(profile, (id, ms) => {
      total += ms;
      if (idleIds.has(id)) idle += ms;
    });
    return { sampledMs: TraceNumbers.round(total), idleMs: TraceNumbers.round(idle), busyMs: TraceNumbers.round(total - idle) };
  }

  static topFunctions(profile, limit = CpuProfileSummary.TOP_FUNCTIONS) {
    if (!profile || !profile.nodes) return [];
    const merged = CpuProfileSummary._mergeByFunction(CpuProfileSummary._selfTimeByNode(profile));
    return merged.filter((f) => f.selfMs > 0 && !CpuProfileSummary.META_FRAMES.has(f.name))
      .sort((a, b) => b.selfMs - a.selfMs).slice(0, limit)
      .map((f) => ({ ...f, selfMs: TraceNumbers.round(f.selfMs) }));
  }

  static _selfTimeByNode(profile) {
    const byId = new Map(profile.nodes.map((node) => [node.id, {
      name: node.callFrame.functionName || '(anonymous)',
      url: TraceEventLabel.shortUrl(node.callFrame.url),
      line: node.callFrame.lineNumber + 1,
      selfMs: 0,
    }]));
    CpuProfileSummary._forEachSample(profile, (id, ms) => {
      const fn = byId.get(id);
      if (fn) fn.selfMs += ms;
    });
    return [...byId.values()];
  }

  static _mergeByFunction(functions) {
    const merged = new Map();
    for (const fn of functions) {
      const key = `${fn.name}|${fn.url}|${fn.line}`;
      const m = merged.get(key) || { ...fn, selfMs: 0 };
      m.selfMs += fn.selfMs;
      merged.set(key, m);
    }
    return [...merged.values()];
  }

  static _forEachSample(profile, visit) {
    (profile.samples || []).forEach((id, i) => visit(id, (profile.timeDeltas[i] || 0) / 1000));
  }
}

module.exports = CpuProfileSummary;
