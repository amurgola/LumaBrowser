const path = require('path');

class InstalledChatModels {
  static NON_CHAT_DIRS = Object.freeze(['image', 'video', 'music', 'tts', 'whisper', 'stt', 'grounding']);

  static FRESH_MS = 5000;
  static SNAPSHOT_STALE_MS = 60000;

  constructor({ scanner, getModelsDir, getDefaults, resolveDisplayName, now = Date.now }) {
    this._scanner = scanner;
    this._getModelsDir = getModelsDir;
    this._getDefaults = getDefaults;
    this._resolveDisplayName = resolveDisplayName;
    this._found = null;
    this._scannedAt = 0;
    this._scanning = null;
    this._now = now;
  }

  async list() {
    const root = this._getModelsDir();
    const scan = await this._scanner.scan(root);
    this._found = InstalledChatModels._found(scan.models || [], path.resolve(root));
    this._scannedAt = this._now();
    return this._rows();
  }

  fresh(maxAgeMs = InstalledChatModels.FRESH_MS) {
    if (this._found && this._now() - this._scannedAt < maxAgeMs) return Promise.resolve(this._rows());
    if (!this._scanning) this._scanning = this.list().finally(() => { this._scanning = null; });
    return this._scanning;
  }

  snapshot() {
    this.fresh(InstalledChatModels.SNAPSHOT_STALE_MS).catch(() => {});
    return this._rows();
  }

  async pathOf(stem) {
    await this.fresh();
    const hit = (this._found || []).find((model) => model.stem === stem);
    return hit ? hit.path : null;
  }

  _rows() {
    const currentStem = this._currentStem();
    const rows = (this._found || []).map(({ stem }) => ({ stem, display: this._resolveDisplayName(stem), current: stem === currentStem }));
    return InstalledChatModels._tellApart(rows).sort(InstalledChatModels._compare);
  }

  static _tellApart(rows) {
    const count = new Map();
    for (const row of rows) count.set(row.display, (count.get(row.display) || 0) + 1);
    return rows.map((row) => (count.get(row.display) > 1 ? { ...row, display: `${row.display} (${row.stem})` } : row));
  }

  static _found(models, root) {
    const seen = new Set();
    const found = [];
    for (const model of models) {
      const stem = InstalledChatModels._chatStem(model, root);
      if (!stem || seen.has(stem)) continue;
      seen.add(stem);
      found.push({ stem, path: model.weights[0].path });
    }
    return found;
  }

  _currentStem() {
    const modelPath = this._getDefaults().modelPath;
    return modelPath ? InstalledChatModels._stemOf(modelPath) : null;
  }

  static _chatStem(model, root) {
    const weights = model.weights && model.weights[0];
    if (!weights || !weights.path || InstalledChatModels._isNonChat(weights.path, root)) return null;
    return InstalledChatModels._stemOf(weights.path);
  }

  static _isNonChat(filePath, root) {
    const relative = path.relative(root, path.resolve(filePath));
    const first = relative.split(path.sep)[0].split('/')[0];
    return !relative.startsWith('..') && InstalledChatModels.NON_CHAT_DIRS.includes(first.toLowerCase());
  }

  static _stemOf(filePath) {
    return path.basename(filePath, path.extname(filePath));
  }

  static _compare(a, b) {
    return (Number(b.current) - Number(a.current)) || String(a.display).localeCompare(String(b.display));
  }
}

module.exports = InstalledChatModels;
