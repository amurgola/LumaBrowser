const path = require('path');

class InstalledChatModels {
  static NON_CHAT_DIRS = Object.freeze(['image', 'video', 'music', 'tts', 'whisper', 'stt', 'grounding']);

  constructor({ scanner, getModelsDir, getDefaults, resolveDisplayName }) {
    this._scanner = scanner;
    this._getModelsDir = getModelsDir;
    this._getDefaults = getDefaults;
    this._resolveDisplayName = resolveDisplayName;
  }

  async list() {
    const root = this._getModelsDir();
    const scan = await this._scanner.scan(root);
    const rows = this._rows(scan.models || [], path.resolve(root), this._currentStem());
    return rows.sort(InstalledChatModels._compare);
  }

  _rows(models, root, currentStem) {
    const seen = new Set();
    const rows = [];
    for (const model of models) {
      const stem = InstalledChatModels._chatStem(model, root);
      if (!stem || seen.has(stem)) continue;
      seen.add(stem);
      rows.push({ stem, display: this._resolveDisplayName(stem), current: stem === currentStem });
    }
    return rows;
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
