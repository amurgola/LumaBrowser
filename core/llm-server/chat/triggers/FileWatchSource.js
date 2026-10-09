const WatchFolder = require('./file/WatchFolder');
const FileWatch = require('./file/FileWatch');

class FileWatchSource {
  static KIND = 'file';
  static SNAPSHOT_KEY_PREFIX = 'core.triggers.fileSnapshot.';

  constructor({ triggerStore, runner, settingsDb = null, emitEvent = () => {}, forbiddenRoots = [] } = {}) {
    if (!triggerStore || !runner) throw new Error('FileWatchSource needs triggerStore + runner');
    this.triggerStore = triggerStore;
    this.runner = runner;
    this._settingsDb = settingsDb;
    this._emit = emitEvent;
    this._forbiddenRoots = forbiddenRoots.filter(Boolean);
    this._watches = new Map();
    this._errors = new Map();
  }

  validateDir(dir) {
    return WatchFolder.validate(dir, { forbiddenRoots: this._forbiddenRoots });
  }

  reconcile() {
    const wanted = this._wantedTriggers();
    this._stopUnwantedOrChanged(wanted);
    for (const [id, trigger] of wanted) if (!this._watches.has(id)) this._start(trigger);
    return { watching: [...this._watches.keys()] };
  }

  status(triggerId) {
    return { watching: this._watches.has(triggerId), error: this._errors.get(triggerId) || null };
  }

  watchFor(triggerId) {
    const entry = this._watches.get(triggerId);
    return entry ? entry.watch : null;
  }

  forget(triggerId) {
    const entry = this._watches.get(triggerId);
    if (entry) {
      entry.watch.stop();
      this._watches.delete(triggerId);
    }
    this._errors.delete(triggerId);
    try {
      if (this._settingsDb) this._settingsDb.delete(FileWatchSource.SNAPSHOT_KEY_PREFIX + triggerId);
    } catch (_) {}
  }

  stopAll() {
    for (const entry of this._watches.values()) entry.watch.stop();
    this._watches.clear();
  }

  _wantedTriggers() {
    const wanted = new Map();
    for (const trigger of this.triggerStore.list()) {
      if (trigger.kind !== FileWatchSource.KIND || !trigger.source || !trigger.source.dir) continue;
      if (trigger.enabled || !trigger.sample) wanted.set(trigger.id, trigger);
    }
    return wanted;
  }

  _stopUnwantedOrChanged(wanted) {
    for (const [id, entry] of this._watches) {
      const trigger = wanted.get(id);
      if (trigger && JSON.stringify(trigger.source) === entry.config) continue;
      entry.watch.stop();
      this._watches.delete(id);
    }
  }

  _start(trigger) {
    let dir;
    try {
      dir = this.validateDir(trigger.source.dir);
    } catch (err) {
      this._errors.set(trigger.id, err.message);
      this._emit('watch-error', { triggerId: trigger.id, title: trigger.title || null, error: err.message });
      return;
    }
    const watch = this._createWatch(trigger, dir);
    this._errors.delete(trigger.id);
    this._watches.set(trigger.id, { watch, config: JSON.stringify(trigger.source) });
    watch.start();
  }

  _createWatch(trigger, dir) {
    const key = FileWatchSource.SNAPSHOT_KEY_PREFIX + trigger.id;
    const source = trigger.source;
    return new FileWatch({
      dir,
      glob: source.glob,
      events: source.events,
      settleMs: source.settleMs,
      recursive: source.recursive,
      catchUp: source.catchUp !== false,
      snapshot: this._settingsDb ? this._settingsDb.get(key, null) : null,
      persist: (snapshot) => { if (this._settingsDb) this._settingsDb.set(key, snapshot); },
      emit: (type, payload) => this._report(trigger, type, payload),
      onEvent: (event, dedupeKey) => { this.runner.deliver(trigger.id, event, { dedupeKey, source: FileWatchSource.KIND }); },
    });
  }

  _report(trigger, type, payload) {
    if (type === 'watch-error') this._errors.set(trigger.id, payload.error);
    this._emit(type, { triggerId: trigger.id, title: trigger.title || null, ...payload });
  }
}

module.exports = FileWatchSource;
