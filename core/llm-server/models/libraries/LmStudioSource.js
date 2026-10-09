const path = require('path');
const LibrarySource = require('./LibrarySource');
const GgufTreeWalker = require('./GgufTreeWalker');

class LmStudioSource extends LibrarySource {
  static MAX_DEPTH = 4;

  get id() { return 'lmstudio'; }

  get label() { return 'LM Studio'; }

  roots() {
    if (this._env.LMSTUDIO_HOME) return [path.join(this._env.LMSTUDIO_HOME, 'models')];
    const home = LibrarySource.homeDir();
    if (!home) return [];
    return [path.join(home, '.lmstudio', 'models'), path.join(home, '.cache', 'lm-studio', 'models')];
  }

  _scanRoot(root) {
    return GgufTreeWalker.walk(root, LmStudioSource.MAX_DEPTH, LibrarySource.MIN_MODEL_BYTES).map((hit) => ({
      name: path.relative(root, hit.path).split(path.sep).join('/'),
      file: hit.file,
      path: hit.path,
      bytes: hit.bytes,
    }));
  }
}

module.exports = LmStudioSource;
