const TraceEventLabel = require('./TraceEventLabel');
const TraceNumbers = require('./TraceNumbers');

class TraceThreadAnalyzer {
  static RUN_TASK = 'ThreadControllerImpl::RunTask';
  static LONG_TASK_MS = 16;
  static TOP_TASKS = 20;
  static TOP_NAMES = 15;
  static BREAKDOWN_ITEMS = 6;

  static analyze(slices) {
    const tree = TraceThreadAnalyzer._buildTree(TraceThreadAnalyzer._completeSlices(slices));
    const durations = tree.tasks.map((t) => t.event.dur);
    return {
      taskCount: tree.tasks.length,
      taskWallMs: TraceNumbers.round(durations.reduce((sum, d) => sum + d, 0) / 1000),
      longestTaskMs: TraceNumbers.round(durations.reduce((m, d) => Math.max(m, d), 0) / 1000),
      longTaskCount: durations.filter((d) => d / 1000 >= TraceThreadAnalyzer.LONG_TASK_MS).length,
      selfTime: TraceThreadAnalyzer._selfTime(tree.roots),
      longTasks: TraceThreadAnalyzer._longestTasks(tree.tasks),
    };
  }

  static _completeSlices(slices) {
    return slices
      .filter((e) => e.ph === 'X' && typeof e.dur === 'number')
      .sort((a, b) => a.ts - b.ts || b.dur - a.dur);
  }

  static _buildTree(events) {
    const stack = [];
    const roots = [];
    const tasks = [];
    for (const e of events) {
      while (stack.length && stack[stack.length - 1].end <= e.ts) stack.pop();
      const parent = stack[stack.length - 1] || null;
      const node = { event: e, end: e.ts + e.dur, childDur: 0, children: [] };
      if (parent) { parent.childDur += e.dur; parent.children.push(node); } else roots.push(node);
      if (e.name === TraceThreadAnalyzer.RUN_TASK) tasks.push(node);
      stack.push(node);
    }
    return { roots, tasks };
  }

  static _selfTime(roots) {
    const byName = new Map();
    const walk = (node) => {
      const self = Math.max(0, node.event.dur - node.childDur) / 1000;
      const key = node.event.name === TraceThreadAnalyzer.RUN_TASK ? 'RunTask (uncategorized)' : TraceEventLabel.describe(node.event, true);
      byName.set(key, (byName.get(key) || 0) + self);
      for (const c of node.children) walk(c);
    };
    for (const r of roots) walk(r);
    return [...byName.entries()].map(([name, ms]) => ({ name, ms: TraceNumbers.round(ms) }))
      .sort((a, b) => b.ms - a.ms).slice(0, TraceThreadAnalyzer.TOP_NAMES);
  }

  static _longestTasks(tasks) {
    return tasks.slice().sort((a, b) => b.event.dur - a.event.dur).slice(0, TraceThreadAnalyzer.TOP_TASKS)
      .map((t) => ({
        atMs: null,
        ts: t.event.ts,
        durationMs: TraceNumbers.round(t.event.dur / 1000),
        breakdown: TraceThreadAnalyzer._breakdown(t),
      }));
  }

  static _breakdown(task) {
    return TraceThreadAnalyzer._descendants(task)
      .sort((a, b) => b.event.dur - a.event.dur)
      .slice(0, TraceThreadAnalyzer.BREAKDOWN_ITEMS)
      .map((n) => ({ what: TraceEventLabel.describe(n.event), ms: TraceNumbers.round(n.event.dur / 1000) }));
  }

  static _descendants(node, out = []) {
    for (const c of node.children) {
      out.push(c);
      TraceThreadAnalyzer._descendants(c, out);
    }
    return out;
  }
}

module.exports = TraceThreadAnalyzer;
