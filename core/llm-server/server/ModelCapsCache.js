const fs = require('fs');
const path = require('path');

class ModelCapsCache {
  static CAPS_KEY = 'core.llmServer.modelCaps';
  static MAX_ENTRIES = 200;

  constructor({ settingsDb, statSync = fs.statSync } = {}) {
    this._settingsDb = settingsDb;
    this._statSync = statSync;
  }

  static modelKeyOf(modelPath) {
    if (!ModelCapsCache._isPath(modelPath)) return '';
    const normalized = path.normalize(modelPath);
    return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
  }

  remember(modelPath, caps) {
    if (!ModelCapsCache._isPath(modelPath)) return false;
    if (!caps || typeof caps.reasoningEffort !== 'boolean') return false;
    const all = this._readAll();
    const key = ModelCapsCache.modelKeyOf(modelPath);
    const entry = this._buildEntry(modelPath, caps);
    if (!this._shouldOverwrite(all[key], entry)) return false;
    all[key] = entry;
    this._pruneOldest(all);
    return this._writeAll(all);
  }

  recall(modelPath) {
    if (!ModelCapsCache._isPath(modelPath)) return null;
    const hit = this._readAll()[ModelCapsCache.modelKeyOf(modelPath)];
    if (!hit || typeof hit.reasoningEffort !== 'boolean') return null;
    if (!ModelCapsCache._sameStamp(hit, this._stampOf(modelPath))) return null;
    return ModelCapsCache._toAnswer(hit);
  }

  recallProbe(modelPath, templateHash) {
    const hit = this.recall(modelPath);
    if (!hit || !hit.thinking || hit.thinking.source !== 'probe') return null;
    if (!templateHash || hit.thinking.templateHash !== templateHash) return null;
    return hit.thinking;
  }

  _buildEntry(modelPath, caps) {
    const stamp = this._stampOf(modelPath);
    return {
      reasoningEffort: caps.reasoningEffort,
      thinking: ModelCapsCache._isThinking(caps.thinking) ? caps.thinking : null,
      size: stamp ? stamp.size : null,
      mtimeMs: stamp ? stamp.mtimeMs : null,
      at: Date.now(),
    };
  }

  _shouldOverwrite(prev, next) {
    const sameFile = !!(prev && next.size !== null && ModelCapsCache._sameStamp(prev, next));
    if (!sameFile) return true;
    if (ModelCapsCache._wouldRegressProbe(prev.thinking, next.thinking)) return false;
    return !ModelCapsCache._sameAnswer(prev, next);
  }

  static _wouldRegressProbe(prevThinking, nextThinking) {
    if (!prevThinking || prevThinking.source !== 'probe') return false;
    if (nextThinking && nextThinking.source === 'probe') return false;
    return !nextThinking || !nextThinking.templateHash || nextThinking.templateHash === prevThinking.templateHash;
  }

  static _sameAnswer(prev, next) {
    return prev.reasoningEffort === next.reasoningEffort
      && JSON.stringify(prev.thinking || null) === JSON.stringify(next.thinking);
  }

  _pruneOldest(all) {
    const keys = Object.keys(all);
    if (keys.length <= ModelCapsCache.MAX_ENTRIES) return;
    keys.sort((a, b) => (all[a].at || 0) - (all[b].at || 0))
      .slice(0, keys.length - ModelCapsCache.MAX_ENTRIES)
      .forEach((k) => { delete all[k]; });
  }

  _readAll() {
    try {
      const value = this._settingsDb.get(ModelCapsCache.CAPS_KEY, null);
      return (value && typeof value === 'object' && !Array.isArray(value)) ? value : {};
    } catch (_) { return {}; }
  }

  _writeAll(all) {
    try { this._settingsDb.set(ModelCapsCache.CAPS_KEY, all); } catch (_) { return false; }
    return true;
  }

  _stampOf(modelPath) {
    try {
      const st = this._statSync(modelPath);
      return { size: st.size, mtimeMs: Math.round(st.mtimeMs) };
    } catch (_) { return null; }
  }

  static _sameStamp(entry, stamp) {
    return !!stamp && entry.size === stamp.size && entry.mtimeMs === stamp.mtimeMs;
  }

  static _toAnswer(hit) {
    const out = { reasoningEffort: hit.reasoningEffort };
    if (ModelCapsCache._isThinking(hit.thinking)) out.thinking = hit.thinking;
    return out;
  }

  static _isThinking(thinking) {
    return !!(thinking && typeof thinking === 'object' && (thinking.source === 'probe' || thinking.source === 'regex'));
  }

  static _isPath(modelPath) {
    return typeof modelPath === 'string' && modelPath.length > 0;
  }
}

module.exports = ModelCapsCache;
