const path = require('path');
const LibrarySource = require('./LibrarySource');
const GgufTreeWalker = require('./GgufTreeWalker');
const FileProbe = require('./FileProbe');

class HfCacheSource extends LibrarySource {
  static SNAPSHOT_MAX_DEPTH = 2;

  static REPO_PREFIX = 'models--';

  get id() { return 'huggingface'; }

  get label() { return 'Hugging Face cache'; }

  roots() {
    if (this._env.HF_HUB_CACHE) return [this._env.HF_HUB_CACHE];
    if (this._env.HF_HOME) return [path.join(this._env.HF_HOME, 'hub')];
    const home = LibrarySource.homeDir();
    return home ? [path.join(home, '.cache', 'huggingface', 'hub')] : [];
  }

  _scanRoot(root) {
    return FileProbe.readDirectory(root)
      .filter((entry) => entry.isDirectory() && entry.name.startsWith(HfCacheSource.REPO_PREFIX))
      .flatMap((entry) => HfCacheSource._scanRepo(root, entry.name));
  }

  static _scanRepo(root, dirName) {
    const snapshots = path.join(root, dirName, 'snapshots');
    if (!FileProbe.isDirectory(snapshots)) return [];
    const repoId = dirName.slice(HfCacheSource.REPO_PREFIX.length).replace(/--/g, '/');
    return GgufTreeWalker.walk(snapshots, HfCacheSource.SNAPSHOT_MAX_DEPTH, LibrarySource.MIN_MODEL_BYTES).map((hit) => ({
      name: `${repoId}/${hit.file}`,
      file: hit.file,
      path: hit.path,
      bytes: hit.bytes,
    }));
  }
}

module.exports = HfCacheSource;
