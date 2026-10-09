class UnsupportedFlagMemory {
  static SETTINGS_KEY = 'llmServer.learnedUnsupportedFlags';

  static runtimeKey(runtime) {
    if (!runtime || !runtime.id) return null;
    const version = runtime.version ? String(runtime.version).trim() : 'unknown';
    return `${runtime.id}@${version}`;
  }

  static learnedFlags(runtime, settingsDb) {
    const key = UnsupportedFlagMemory.runtimeKey(runtime);
    if (!key) return [];
    const list = UnsupportedFlagMemory._readAll(settingsDb)[key];
    return Array.isArray(list) ? list.filter((flag) => typeof flag === 'string' && flag) : [];
  }

  static withLearnedFlags(runtime, settingsDb) {
    if (!runtime) return runtime;
    const learned = UnsupportedFlagMemory.learnedFlags(runtime, settingsDb);
    if (learned.length === 0) return runtime;
    return UnsupportedFlagMemory._mergeLearned(runtime, learned);
  }

  static remember(runtime, flag, settingsDb) {
    const key = UnsupportedFlagMemory.runtimeKey(runtime);
    const trimmed = typeof flag === 'string' ? flag.trim() : '';
    if (!key || !trimmed || !UnsupportedFlagMemory._isWritable(settingsDb)) return false;
    const all = UnsupportedFlagMemory._readAll(settingsDb);
    const list = Array.isArray(all[key]) ? all[key].slice() : [];
    if (list.includes(trimmed)) return false;
    list.push(trimmed);
    return UnsupportedFlagMemory._writeAll(settingsDb, { ...all, [key]: list });
  }

  static _mergeLearned(runtime, learned) {
    const base = Array.isArray(runtime.unsupportedFlags) ? runtime.unsupportedFlags : [];
    const merged = Array.from(new Set([...base, ...learned]));
    return { ...runtime, unsupportedFlags: merged, learnedUnsupportedFlags: learned.slice() };
  }

  static _readAll(settingsDb) {
    if (!settingsDb || typeof settingsDb.get !== 'function') return {};
    try {
      const value = settingsDb.get(UnsupportedFlagMemory.SETTINGS_KEY, {});
      return UnsupportedFlagMemory._isPlainObject(value) ? value : {};
    } catch (_) {
      return {};
    }
  }

  static _writeAll(settingsDb, all) {
    try {
      settingsDb.set(UnsupportedFlagMemory.SETTINGS_KEY, all);
      return true;
    } catch (_) {
      return false;
    }
  }

  static _isWritable(settingsDb) {
    return !!settingsDb && typeof settingsDb.set === 'function';
  }

  static _isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }
}

module.exports = UnsupportedFlagMemory;
