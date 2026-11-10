const fs = require('fs');
const path = require('path');

class HelperModelSettings {
  static ENABLED_KEY = 'core.llmServer.helper.enabled';
  static MODEL_PATH_KEY = 'core.llmServer.helper.modelPath';
  static CUDA_DEVICE_KEY = 'core.llmServer.helper.cudaDevice';
  static CONTEXT_KEY = 'core.llmServer.helper.contextSize';
  static DEFAULT_CONTEXT = 8192;
  static MIN_CONTEXT = 2048;
  static MAX_CONTEXT = 65536;

  constructor({ settingsDb }) {
    this._db = settingsDb;
  }

  isEnabled() { return !!this._db.get(HelperModelSettings.ENABLED_KEY, false); }

  setEnabled(value) {
    if (value) this._db.set(HelperModelSettings.ENABLED_KEY, true);
    else this._db.delete(HelperModelSettings.ENABLED_KEY);
  }

  modelPath() {
    const value = this._db.get(HelperModelSettings.MODEL_PATH_KEY, null);
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  setModelPath(value) {
    const text = typeof value === 'string' ? value.trim() : '';
    if (text) this._db.set(HelperModelSettings.MODEL_PATH_KEY, text);
    else this._db.delete(HelperModelSettings.MODEL_PATH_KEY);
  }

  cudaDevice() {
    const value = this._db.get(HelperModelSettings.CUDA_DEVICE_KEY, undefined);
    if (value === undefined || value === null) return undefined;
    const text = String(value).trim();
    return text === '' ? null : text;
  }

  setCudaDevice(value) {
    if (value === undefined) { this._db.delete(HelperModelSettings.CUDA_DEVICE_KEY); return; }
    this._db.set(HelperModelSettings.CUDA_DEVICE_KEY, value === null ? '' : String(value).trim());
  }

  contextSize() {
    const raw = Number(this._db.get(HelperModelSettings.CONTEXT_KEY, null));
    if (!Number.isFinite(raw) || raw <= 0) return HelperModelSettings.DEFAULT_CONTEXT;
    return Math.max(HelperModelSettings.MIN_CONTEXT, Math.min(HelperModelSettings.MAX_CONTEXT, Math.floor(raw)));
  }

  setContextSize(value) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) this._db.set(HelperModelSettings.CONTEXT_KEY, Math.floor(n));
    else this._db.delete(HelperModelSettings.CONTEXT_KEY);
  }

  isModelInstalled() {
    const p = this.modelPath();
    if (!p) return false;
    try { return fs.statSync(p).isFile(); } catch (_) { return false; }
  }

  modelStem() {
    const p = this.modelPath();
    return p ? path.basename(p).replace(/\.gguf$/i, '') : '';
  }

  snapshot() {
    const device = this.cudaDevice();
    return { enabled: this.isEnabled(), modelPath: this.modelPath(), cudaDevice: device === undefined ? '' : (device === null ? 'all' : device), contextSize: this.contextSize() };
  }

  apply(patch) {
    const p = patch || {};
    if (p.enabled !== undefined) this.setEnabled(!!p.enabled);
    if (p.modelPath !== undefined) this.setModelPath(p.modelPath);
    if (p.cudaDevice !== undefined) {
      const text = p.cudaDevice === null ? '' : String(p.cudaDevice).trim().toLowerCase();
      if (text === '' || text === 'auto') this.setCudaDevice(undefined);
      else if (text === 'all') this.setCudaDevice(null);
      else this.setCudaDevice(String(p.cudaDevice).trim());
    }
    if (p.contextSize !== undefined) this.setContextSize(p.contextSize);
  }
}

module.exports = HelperModelSettings;
