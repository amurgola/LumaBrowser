const fs = require('fs');
const path = require('path');
const FileGlobMatcher = require('./FileGlobMatcher');
const FileEventBuilder = require('./FileEventBuilder');
const FolderScanner = require('./FolderScanner');
const CatchUpPlan = require('./CatchUpPlan');

class FileWatch {
  static FILE_EVENTS = ['add', 'change', 'remove'];
  static DEFAULT_EVENTS = ['add', 'change'];
  static DEFAULT_SETTLE_MS = 1500;
  static MIN_SETTLE_MS = 200;
  static MAX_SETTLE_MS = 60 * 1000;
  static SNAPSHOT_MAX_FILES = 5000;

  constructor({ dir, glob, events, settleMs, recursive, catchUp = true, onEvent, snapshot = null, persist = () => {}, emit = () => {} }) {
    this.dir = dir;
    this.recursive = !!recursive;
    this.catchUp = catchUp !== false;
    this.events = FileWatch._normalizeEvents(events);
    this.settleMs = Math.min(FileWatch.MAX_SETTLE_MS, Math.max(FileWatch.MIN_SETTLE_MS, Number(settleMs) || FileWatch.DEFAULT_SETTLE_MS));
    this.snapshot = new Map(Object.entries((snapshot && snapshot.files) || {}));
    this.error = null;
    this.ready = null;
    this._matches = FileGlobMatcher.create(glob);
    this._onEvent = onEvent;
    this._persistSnapshot = persist;
    this._emit = emit;
    this._hadSnapshot = !!(snapshot && snapshot.files);
    this._timers = new Map();
    this._pending = new Map();
    this._watcher = null;
  }

  start() {
    if (this._watcher) return this.ready;
    try {
      this._watcher = fs.watch(this.dir, { recursive: this.recursive, persistent: false }, (_type, filename) => {
        if (filename) this._schedule(FileGlobMatcher.toPosix(String(filename)));
      });
      this._watcher.on('error', (err) => { this._fail(err); this.stop(); });
    } catch (err) {
      this._fail(err);
      this._watcher = null;
      return Promise.resolve();
    }
    this.ready = this._initialScan().catch(() => {});
    return this.ready;
  }

  stop() {
    for (const timer of this._timers.values()) clearTimeout(timer);
    this._timers.clear();
    this._pending.clear();
    if (this._watcher) {
      try { this._watcher.close(); } catch (_) {}
      this._watcher = null;
    }
  }

  async _initialScan() {
    const { files, overflow } = await FolderScanner.scan(this.dir, { recursive: this.recursive, matches: this._matches });
    if (!this._hadSnapshot || !this.catchUp || overflow) {
      this.snapshot = files;
      this._persist(overflow);
      return;
    }
    const plan = CatchUpPlan.build(this.snapshot, files, this.events);
    const hadChanges = plan.fire.length + plan.dropped > 0;
    this.snapshot = files;
    this._persist();
    if (hadChanges) this._emit('catch-up', { fired: plan.fire.length, dropped: plan.dropped });
    for (const candidate of plan.fire) await this._replay(candidate);
  }

  async _replay({ rel, kind, sig }) {
    const abs = this._absPath(rel);
    let stat = null;
    if (kind !== 'remove') {
      try { stat = await fs.promises.stat(abs); } catch (_) { return; }
    }
    const event = await FileEventBuilder.build(kind, this.dir, abs, stat);
    event.catchUp = true;
    this._deliver(event, rel, sig);
  }

  _schedule(rel) {
    if (!this._matches(rel)) return;
    const previous = this._timers.get(rel);
    if (previous) clearTimeout(previous);
    fs.promises.stat(this._absPath(rel)).then(
      (stat) => { this._pending.set(rel, [stat.mtimeMs, stat.size]); },
      () => { this._pending.set(rel, null); },
    );
    this._armSettleTimer(rel);
  }

  _armSettleTimer(rel) {
    const timer = setTimeout(() => {
      this._timers.delete(rel);
      this._settle(rel).catch(() => {});
    }, this.settleMs);
    if (timer.unref) timer.unref();
    this._timers.set(rel, timer);
  }

  async _settle(rel) {
    const stat = await this._statOrNull(rel);
    if (stat && !stat.isFile()) { this._pending.delete(rel); return; }
    const sig = stat ? [stat.mtimeMs, stat.size] : null;
    if (this._stillMoving(rel, sig)) {
      this._pending.set(rel, sig);
      this._armSettleTimer(rel);
      return;
    }
    this._pending.delete(rel);
    if (sig) await this._settledPresent(rel, sig, stat);
    else await this._settledGone(rel);
  }

  _stillMoving(rel, sig) {
    const seen = this._pending.get(rel);
    if (!!seen !== !!sig) return true;
    return !!seen && !CatchUpPlan.sameSignature(seen, sig);
  }

  async _settledPresent(rel, sig, stat) {
    const previous = this.snapshot.get(rel);
    if (CatchUpPlan.sameSignature(previous, sig)) return;
    const kind = previous ? 'change' : 'add';
    this.snapshot.set(rel, sig);
    this._persist();
    if (!this.events.includes(kind)) return;
    this._deliver(await FileEventBuilder.build(kind, this.dir, this._absPath(rel), stat), rel, sig);
  }

  async _settledGone(rel) {
    if (!this.snapshot.has(rel)) return;
    this.snapshot.delete(rel);
    this._persist();
    if (!this.events.includes('remove')) return;
    this._deliver(await FileEventBuilder.build('remove', this.dir, this._absPath(rel), null), rel, null);
  }

  _deliver(event, rel, sig) {
    const key = `${event.event}|${rel}|${sig ? sig[0] : 'gone'}|${sig ? sig[1] : ''}`;
    try { this._onEvent(event, key); } catch (_) {}
  }

  _persist(overflow = false) {
    try {
      const at = new Date().toISOString();
      if (overflow || this.snapshot.size > FileWatch.SNAPSHOT_MAX_FILES) this._persistSnapshot({ at, overflow: true });
      else this._persistSnapshot({ at, files: Object.fromEntries(this.snapshot) });
    } catch (_) {}
  }

  _fail(err) {
    this.error = (err && err.message) || String(err);
    this._emit('watch-error', { error: this.error });
  }

  async _statOrNull(rel) {
    try {
      return await fs.promises.stat(this._absPath(rel));
    } catch (_) {
      return null;
    }
  }

  _absPath(rel) {
    return path.join(this.dir, ...rel.split('/'));
  }

  static _normalizeEvents(events) {
    if (!Array.isArray(events) || !events.length) return FileWatch.DEFAULT_EVENTS.slice();
    return events.filter((e) => FileWatch.FILE_EVENTS.includes(e));
  }
}

module.exports = FileWatch;
