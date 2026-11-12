const Module = require('module');
const { performance } = require('perf_hooks');

class ModuleLoadTimer {
  static MIN_MS = 1;

  constructor({ target = Module, now = () => performance.now() } = {}) {
    this._target = target;
    this._now = now;
    this._loads = [];
    this._childMs = 0;
  }

  install() {
    this._original = this._target._load;
    const timer = this;
    this._target._load = function timedLoad(...args) {
      return timer._timed(this, args);
    };
    return this;
  }

  uninstall() {
    if (this._original) this._target._load = this._original;
  }

  sortedLoads() {
    return this._loads.slice().sort((a, b) => b.selfMs - a.selfMs);
  }

  _timed(self, args) {
    const start = this._now();
    const previous = this._childMs;
    this._childMs = 0;
    try {
      return this._original.apply(self, args);
    } finally {
      this._record(args[0], args[1], start, previous);
    }
  }

  _record(request, parent, start, previous) {
    const duration = this._now() - start;
    const selfMs = duration - this._childMs;
    this._childMs = previous + duration;
    if (duration > ModuleLoadTimer.MIN_MS) {
      this._loads.push({ request, parent: parent && parent.filename, durationMs: duration, selfMs });
    }
  }
}

module.exports = ModuleLoadTimer;
