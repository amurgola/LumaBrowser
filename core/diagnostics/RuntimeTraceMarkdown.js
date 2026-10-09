class RuntimeTraceMarkdown {
  static render(s) {
    return [
      ...RuntimeTraceMarkdown._intro(s),
      ...RuntimeTraceMarkdown._rendererCounters(s),
      ...RuntimeTraceMarkdown._mainLoop(s),
      ...RuntimeTraceMarkdown._threads(s),
      ...RuntimeTraceMarkdown._hotThreads(s),
      ...RuntimeTraceMarkdown._cpuProfiles(s),
      '## Processes\n',
      RuntimeTraceMarkdown.table(s.processes, [['type', 'Type'], ['name', 'Name'], ['pid', 'PID'], ['cpuPercent', 'CPU %'], ['privateMB', 'Private MB']]),
    ].join('\n');
  }

  static headline(s) {
    const parts = [];
    if (s.renderer.longTasks) parts.push(`UI thread: ${s.renderer.longTasks} long tasks, worst ${s.renderer.worstLongTaskMs}ms`);
    else parts.push('UI thread: no long tasks observed');
    parts.push(`main loop: worst ${s.mainLoop.maxMs}ms`);
    const top = s.shellUiThread && s.shellUiThread.selfTime[0];
    if (top) parts.push(`top UI self time: ${top.name} ${top.ms}ms`);
    return parts.join(' | ');
  }

  static table(rows, columns) {
    if (!rows.length) return '_none_\n';
    const head = `| ${columns.map(([, label]) => label).join(' | ')} |`;
    const sep = `| ${columns.map(() => '---').join(' | ')} |`;
    const body = rows.map((r) => `| ${columns.map(([key]) => String(r[key] ?? '')).join(' | ')} |`);
    return [head, sep, ...body].join('\n') + '\n';
  }

  static _intro(s) {
    const out = [`# Runtime trace ${s.label}\n`, `Captured ${s.startedAt} for ${s.durationMs} ms.\n`];
    if (s.notes.length) out.push(`Notes:\n${s.notes.map((n) => `- ${n}`).join('\n')}\n`);
    out.push('## Headline\n', RuntimeTraceMarkdown.headline(s) + '\n');
    return out;
  }

  static _rendererCounters(s) {
    const r = s.renderer;
    const out = ['## Shell renderer counters\n', RuntimeTraceMarkdown.table([
      { k: 'Long tasks (>50 ms)', v: `${r.longTasks} totalling ${r.longTaskMs} ms, worst ${r.worstLongTaskMs} ms` },
      { k: 'rAF gaps over 33 ms', v: `${r.frameGaps}, worst ${r.worstFrameGapMs} ms` },
      { k: 'Window resize events', v: r.resizeEvents },
      { k: 'Mouse moves seen by shell', v: r.mouseMoves },
      { k: 'Native-view bounds calcs', v: `${r.boundsCalcs} (${r.boundsCalcMs} ms), ${r.boundsSends} sent to main` },
    ], [['k', 'Counter'], ['v', 'Value']])];
    if (r.slowInputEvents.length) {
      out.push('Slow input events (Event Timing):\n');
      out.push(RuntimeTraceMarkdown.table(r.slowInputEvents, [['type', 'Event'], ['target', 'Target'], ['ms', 'ms']]));
    }
    return out;
  }

  static _mainLoop(s) {
    const m = s.mainLoop;
    const out = ['## Main process event loop\n',
      `Worst delay ${m.maxMs} ms. Buckets (100 ms) over 16 ms: ${m.bucketsOver16ms}; over 50 ms: ${m.bucketsOver50ms}.\n`];
    if (m.stalls.length) out.push(RuntimeTraceMarkdown.table(m.stalls, [['atMs', 'At (ms)'], ['maxMs', 'Max delay (ms)']]));
    return out;
  }

  static _threads(s) {
    return ['## Threads by task wall time\n', RuntimeTraceMarkdown.table(s.threads, [
      ['role', 'Role'], ['name', 'Thread'], ['process', 'Process'], ['pid', 'PID'],
      ['taskCount', 'Tasks'], ['taskWallMs', 'Wall ms'], ['longTaskCount', '>16 ms'], ['longestTaskMs', 'Longest ms'],
    ])];
  }

  static _hotThreads(s) {
    const out = [];
    for (const [title, t] of [['Shell UI thread', s.shellUiThread], ['Main process thread', s.mainProcessThread]]) {
      if (!t) continue;
      out.push(`## ${title}: self time by activity\n`);
      out.push(RuntimeTraceMarkdown.table(t.selfTime, [['name', 'Activity'], ['ms', 'Self ms']]));
      out.push(`## ${title}: longest tasks\n`);
      for (const task of t.longTasks) {
        out.push(`- **${task.durationMs} ms** at +${task.atMs} ms`);
        for (const b of task.breakdown) out.push(`  - ${b.ms} ms ${b.what}`);
      }
      out.push('');
    }
    return out;
  }

  static _cpuProfiles(s) {
    const columns = [['name', 'Function'], ['url', 'File'], ['line', 'Line'], ['selfMs', 'Self ms']];
    return [
      '## Shell renderer CPU profile: top self time\n',
      RuntimeTraceMarkdown._busyLine(s.rendererCpu),
      RuntimeTraceMarkdown.table(s.rendererCpuFunctions, columns),
      '## Main process CPU profile: top self time\n',
      RuntimeTraceMarkdown._busyLine(s.mainCpu),
      RuntimeTraceMarkdown.table(s.mainCpuFunctions, columns),
    ];
  }

  static _busyLine(b) {
    return b ? `Sampled ${b.sampledMs} ms: ${b.busyMs} ms busy, ${b.idleMs} ms idle.\n` : 'No profile.\n';
  }
}

module.exports = RuntimeTraceMarkdown;
