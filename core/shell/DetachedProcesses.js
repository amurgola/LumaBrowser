const ChildProcessRegistry = require('./ChildProcessRegistry');
const DetachedProcess = require('./detached-processes/DetachedProcess');
const LogTail = require('./detached-processes/LogTail');

class DetachedProcesses {
  static MAX_FINISHED = 50;
  static DEFAULT_TAIL_BYTES = LogTail.DEFAULT_BYTES;
  static _entries = new Map();
  static _finished = [];

  static register(options = {}) {
    if (!DetachedProcess.isRegistrable(options.child)) return null;
    const entry = new DetachedProcess(options);
    DetachedProcesses._entries.set(entry.pid, entry);
    ChildProcessRegistry.track(options.child);
    entry.watch((settled) => DetachedProcesses._retain(settled.pid));
    return entry.view();
  }

  static status(pid) {
    const entry = DetachedProcesses._entry(pid);
    return entry ? entry.view() : null;
  }

  static list() {
    return [...DetachedProcesses._entries.values()].map((entry) => entry.view()).sort(DetachedProcesses._byRunningThenNewest);
  }

  static tail(pid, bytes = LogTail.DEFAULT_BYTES) {
    const entry = DetachedProcesses._entry(pid);
    return entry ? LogTail.read(entry.logPath, bytes) : null;
  }

  static kill(pid) {
    const entry = DetachedProcesses._entry(pid);
    return entry ? entry.kill() : { ok: false, reason: 'unknown pid' };
  }

  static onExit(pid, listener) {
    const entry = DetachedProcesses._entry(pid);
    if (!entry || typeof listener !== 'function') return false;
    entry.addExitListener(listener);
    return true;
  }

  static reset() {
    DetachedProcesses._entries.clear();
    DetachedProcesses._finished.length = 0;
  }

  static _entry(pid) {
    return DetachedProcesses._entries.get(Number(pid));
  }

  static _retain(pid) {
    const finished = DetachedProcesses._finished;
    finished.push(pid);
    while (finished.length > DetachedProcesses.MAX_FINISHED) {
      const oldest = finished.shift();
      if (oldest !== pid) DetachedProcesses._entries.delete(oldest);
    }
  }

  static _byRunningThenNewest(a, b) {
    if (a.running === b.running) return b.startedAt - a.startedAt;
    return a.running ? -1 : 1;
  }
}

module.exports = DetachedProcesses;
