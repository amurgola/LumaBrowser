const fs = require('fs');
const path = require('path');

class PerformanceSummary {
  static RUN_TASK = 'ThreadControllerImpl::RunTask';
  static TOP_FUNCTIONS = 40;
  static CONSOLE_FUNCTIONS = 8;
  static CONSOLE_THREADS = /Main|Compositor$|adblock/;

  constructor(dir) {
    this._dir = dir;
  }

  execute() {
    this._readRun();
    const summary = this._buildSummary();
    fs.writeFileSync(path.join(this._dir, 'summary.json'), JSON.stringify(summary, null, 2));
    return { summary, highlights: PerformanceSummary.highlights(summary) };
  }

  static highlights(summary) {
    return {
      threads: summary.threads.filter((t) => PerformanceSummary.CONSOLE_THREADS.test(t.name)),
      topMainFunctions: summary.mainCpuFunctions.slice(0, PerformanceSummary.CONSOLE_FUNCTIONS),
    };
  }

  _readRun() {
    this._report = this._readJson('report.json');
    this._trace = this._readJson('chromium-trace.json');
    this._profile = this._readJson('main.cpuprofile');
  }

  _readJson(name) {
    return JSON.parse(fs.readFileSync(path.join(this._dir, name), 'utf8'));
  }

  _buildSummary() {
    const report = this._report;
    return {
      startup: { shellDomReadyFromLaunchMs: report.shellReadyMs, milestones: report.startup.milestones, eventLoop: report.startup.eventLoop },
      contents: report.idle.contents,
      processes: report.idle.metrics,
      threads: this._threads(),
      mainCpuFunctions: this._mainCpuFunctions(),
      rendering: report.rendering,
    };
  }

  _threads() {
    const threads = this._namedThreads();
    for (const event of this._trace.traceEvents) {
      if (event.ph !== 'X' || event.name !== PerformanceSummary.RUN_TASK) continue;
      const thread = threads.get(`${event.pid}:${event.tid}`);
      if (thread) PerformanceSummary._addTask(thread, (event.dur || 0) / 1000);
    }
    return [...threads.values()].sort((a, b) => b.taskWallMs - a.taskWallMs);
  }

  _namedThreads() {
    const threads = new Map();
    for (const event of this._trace.traceEvents) {
      if (event.ph !== 'M' || event.name !== 'thread_name') continue;
      threads.set(`${event.pid}:${event.tid}`, {
        pid: event.pid, tid: event.tid, name: event.args.name, taskCount: 0, taskWallMs: 0, longestTaskMs: 0,
      });
    }
    return threads;
  }

  static _addTask(thread, ms) {
    thread.taskCount++;
    thread.taskWallMs += ms;
    thread.longestTaskMs = Math.max(thread.longestTaskMs, ms);
  }

  _mainCpuFunctions() {
    const profile = this._profile;
    const functions = new Map(profile.nodes.map((node) => [node.id, {
      name: node.callFrame.functionName, url: node.callFrame.url, line: node.callFrame.lineNumber + 1, sampledSelfMs: 0,
    }]));
    profile.samples.forEach((sample, index) => {
      functions.get(sample).sampledSelfMs += (profile.timeDeltas[index] || 0) / 1000;
    });
    return [...functions.values()].sort((a, b) => b.sampledSelfMs - a.sampledSelfMs).slice(0, PerformanceSummary.TOP_FUNCTIONS);
  }
}

module.exports = PerformanceSummary;
