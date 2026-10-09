const path = require('path');
const SherpaSttScanner = require('../sherpa/SherpaSttScanner');
const WhisperModelsScanner = require('../WhisperModelsScanner');

class SttModelLibrary {
  constructor({ sherpaModelsDir, whisperModelsDir, sherpaScanner = new SherpaSttScanner(), whisperScanner = new WhisperModelsScanner() }) {
    this._sherpaModelsDir = sherpaModelsDir;
    this._whisperModelsDir = whisperModelsDir;
    this._sherpaScanner = sherpaScanner;
    this._whisperScanner = whisperScanner;
  }

  list() {
    const sherpa = this._sherpaScanner.scan(this._sherpaModelsDir());
    const whisper = this._whisperScanner.scan(this._whisperModelsDir()).map((model) => ({ ...model, engine: 'whisper' }));
    return sherpa.concat(whisper);
  }

  resolve(chosenPath, models = this.list()) {
    if (chosenPath) {
      const chosen = SttModelLibrary._normalise(chosenPath);
      const hit = models.find((model) => SttModelLibrary._normalise(model.path) === chosen);
      if (hit) return hit;
    }
    return models.length ? models[0] : null;
  }

  static _normalise(modelPath) {
    return path.resolve(String(modelPath)).toLowerCase();
  }
}

module.exports = SttModelLibrary;
