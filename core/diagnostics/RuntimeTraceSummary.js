const fs = require('fs');
const path = require('path');
const TraceThreadCollector = require('./TraceThreadCollector');
const CpuProfileSummary = require('./CpuProfileSummary');
const RuntimeTraceMarkdown = require('./RuntimeTraceMarkdown');
const TraceNumbers = require('./TraceNumbers');

class RuntimeTraceSummary {
  static STALL_MS = 50;
  static JANK_MS = 16;
  static MAX_STALLS = 30;
  static SLOW_INPUT_EVENTS = 10;

  constructor(dir) {
    this._dir = dir;
  }

  static summarize(dir) {
    return new RuntimeTraceSummary(dir).execute();
  }

  execute() {
    this._readCapture();
    const json = this._buildSummary();
    const markdown = RuntimeTraceMarkdown.render(json);
    this._writeOutputs(json, markdown);
    return { json, markdown, headline: RuntimeTraceMarkdown.headline(json) };
  }

  _readCapture() {
    this._report = this._readJson('report.json');
    this._trace = this._readJson('chromium-trace.json', true);
    this._mainProfile = this._readJson('main.cpuprofile', true);
    this._rendererProfile = this._readJson('renderer.cpuprofile', true);
  }

  _buildSummary() {
    const report = this._report;
    const threads = TraceThreadCollector.collect(this._trace, report);
    return {
      label: report.label, startedAt: report.startedAt, durationMs: report.durationMs, notes: report.notes || [],
      mainLoop: this._mainLoop(),
      renderer: this._rendererCounters(),
      threads: threads.map(({ longTasks, selfTime, ...t }) => t),
      shellUiThread: RuntimeTraceSummary._hotThread(threads, 'shell UI thread'),
      mainProcessThread: RuntimeTraceSummary._hotThread(threads, 'main process'),
      mainCpu: CpuProfileSummary.busy(this._mainProfile),
      rendererCpu: CpuProfileSummary.busy(this._rendererProfile),
      mainCpuFunctions: CpuProfileSummary.topFunctions(this._mainProfile),
      rendererCpuFunctions: CpuProfileSummary.topFunctions(this._rendererProfile),
      processes: this._processes(),
    };
  }

  _mainLoop() {
    const series = (this._report.mainEventLoop && this._report.mainEventLoop.series) || [];
    const stalls = series.filter((s) => s.maxMs >= RuntimeTraceSummary.STALL_MS).map((s) => ({ atMs: s.t, maxMs: TraceNumbers.round(s.maxMs) }));
    return {
      maxMs: TraceNumbers.round(series.reduce((m, s) => Math.max(m, s.maxMs), 0)),
      bucketsOver16ms: series.filter((s) => s.maxMs >= RuntimeTraceSummary.JANK_MS).length,
      bucketsOver50ms: stalls.length,
      stalls: stalls.slice(0, RuntimeTraceSummary.MAX_STALLS),
    };
  }

  _rendererCounters() {
    const r = this._report.renderer || {};
    const longTasks = r.longTasks || [];
    const frameGaps = r.frameGaps || [];
    return {
      longTasks: longTasks.length,
      longTaskMs: TraceNumbers.round(longTasks.reduce((s, t) => s + t.duration, 0)),
      worstLongTaskMs: TraceNumbers.round(longTasks.reduce((m, t) => Math.max(m, t.duration), 0)),
      frameGaps: frameGaps.length,
      worstFrameGapMs: TraceNumbers.round(frameGaps.reduce((m, g) => Math.max(m, g.gap), 0)),
      slowInputEvents: RuntimeTraceSummary._slowInputEvents(r.slowEvents || []),
      resizeEvents: r.resizeEvents || 0,
      mouseMoves: r.mouseMoves || 0,
      boundsCalcs: r.boundsCalcs || 0,
      boundsCalcMs: TraceNumbers.round(r.boundsCalcMs || 0),
      boundsSends: r.boundsSends || 0,
    };
  }

  _processes() {
    return (this._report.metrics || []).map((m) => ({
      pid: m.pid, type: m.type, name: m.name,
      cpuPercent: TraceNumbers.round(m.cpu.percentCPUUsage),
      privateMB: TraceNumbers.round((m.memory.privateBytes || 0) / 1024),
    }));
  }

  _writeOutputs(json, markdown) {
    fs.writeFileSync(path.join(this._dir, 'summary.json'), JSON.stringify(json, null, 2));
    fs.writeFileSync(path.join(this._dir, 'summary.md'), markdown);
  }

  _readJson(name, optional = false) {
    const file = path.join(this._dir, name);
    if (!fs.existsSync(file)) {
      if (optional) return null;
      throw new Error(`Missing ${name} in ${this._dir}`);
    }
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }

  static _slowInputEvents(events) {
    return events.slice().sort((a, b) => b.duration - a.duration).slice(0, RuntimeTraceSummary.SLOW_INPUT_EVENTS)
      .map((e) => ({ type: e.type, target: e.target, ms: TraceNumbers.round(e.duration) }));
  }

  static _hotThread(threads, role) {
    const thread = threads.find((t) => t.role === role);
    return thread ? { selfTime: thread.selfTime, longTasks: thread.longTasks } : null;
  }
}

module.exports = RuntimeTraceSummary;
