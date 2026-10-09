const TraceThreadAnalyzer = require('./TraceThreadAnalyzer');
const TraceNumbers = require('./TraceNumbers');

class TraceThreadCollector {
  static UI_THREADS = /CrBrowserMain|CrRendererMain|Compositor|CrGpuMain|VizCompositor|Chrome_IOThread|CrProcessMain/;

  static collect(trace, report) {
    if (!trace || !Array.isArray(trace.traceEvents)) return [];
    const index = TraceThreadCollector._index(trace.traceEvents);
    const threads = [];
    for (const [key, slices] of index.byThread) {
      const thread = TraceThreadCollector._analyzeThread(key, slices, index, report);
      if (thread) threads.push(thread);
    }
    return threads.sort((a, b) => b.taskWallMs - a.taskWallMs);
  }

  static _index(events) {
    const threadNames = new Map();
    const processNames = new Map();
    const byThread = new Map();
    let startTs = Infinity;
    for (const e of events) {
      if (e.ph === 'M' && e.name === 'thread_name') threadNames.set(`${e.pid}:${e.tid}`, e.args.name);
      if (e.ph === 'M' && e.name === 'process_name') processNames.set(e.pid, e.args.name);
      if (e.ph !== 'X') continue;
      startTs = Math.min(startTs, e.ts);
      const key = `${e.pid}:${e.tid}`;
      if (!byThread.has(key)) byThread.set(key, []);
      byThread.get(key).push(e);
    }
    return { threadNames, processNames, byThread, startTs };
  }

  static _analyzeThread(key, slices, index, report) {
    const [pid, tid] = key.split(':').map(Number);
    const name = index.threadNames.get(key) || `tid ${tid}`;
    if (!TraceThreadCollector.UI_THREADS.test(name)) return null;
    const analysis = TraceThreadAnalyzer.analyze(slices);
    if (!analysis.taskCount) return null;
    for (const t of analysis.longTasks) t.atMs = TraceNumbers.round((t.ts - index.startTs) / 1000);
    return {
      pid, tid, name,
      process: index.processNames.get(pid) || '',
      role: TraceThreadCollector._role(pid, name, report),
      ...analysis,
    };
  }

  static _role(pid, name, report) {
    const shell = report.shell || {};
    if (pid === shell.pid && name === 'CrRendererMain') return 'shell UI thread';
    if (name === 'CrBrowserMain') return 'main process';
    const isPage = (report.contents || []).some((c) => c.pid === pid && c.id !== shell.webContentsId);
    return isPage && name === 'CrRendererMain' ? 'page renderer' : '';
  }
}

module.exports = TraceThreadCollector;
