const fs = require('fs');
const path = require('path');
const LibrarySource = require('./LibrarySource');
const FileProbe = require('./FileProbe');

class OllamaSource extends LibrarySource {
  static MANIFEST_MAX_DEPTH = 5;

  static WEIGHTS_MEDIA_TYPE = /image\.model$/;

  get id() { return 'ollama'; }

  get label() { return 'Ollama'; }

  roots() {
    if (this._env.OLLAMA_MODELS) return [this._env.OLLAMA_MODELS];
    const home = LibrarySource.homeDir();
    return home ? [path.join(home, '.ollama', 'models')] : [];
  }

  _scanRoot(root) {
    const manifestRoot = path.join(root, 'manifests');
    const blobsDir = path.join(root, 'blobs');
    if (!FileProbe.isDirectory(manifestRoot) || !FileProbe.isDirectory(blobsDir)) return [];
    return OllamaSource._manifestFiles(manifestRoot, 0)
      .map((manifestPath) => OllamaSource._modelFor(manifestPath, manifestRoot, blobsDir))
      .filter(Boolean);
  }

  static _manifestFiles(dir, depth) {
    if (depth > OllamaSource.MANIFEST_MAX_DEPTH) return [];
    return FileProbe.readDirectory(dir).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return OllamaSource._manifestFiles(full, depth + 1);
      return entry.isFile() ? [full] : [];
    });
  }

  static _modelFor(manifestPath, manifestRoot, blobsDir) {
    const digest = OllamaSource._weightsDigest(manifestPath);
    if (!digest) return null;
    const blobPath = path.join(blobsDir, digest.replace(':', '-'));
    const bytes = FileProbe.sizeIfAtLeast(blobPath, LibrarySource.MIN_MODEL_BYTES);
    if (bytes == null) return null;
    const label = OllamaSource._modelLabel(manifestPath, manifestRoot);
    return { name: label, file: `${label.replace(/[^\w.-]+/g, '-')}.gguf`, path: blobPath, bytes };
  }

  static _weightsDigest(manifestPath) {
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (_) {
      return null;
    }
    const layers = Array.isArray(manifest && manifest.layers) ? manifest.layers : [];
    const weights = layers.find((layer) => layer && typeof layer.mediaType === 'string' && OllamaSource.WEIGHTS_MEDIA_TYPE.test(layer.mediaType));
    return weights && typeof weights.digest === 'string' ? weights.digest : null;
  }

  static _modelLabel(manifestPath, manifestRoot) {
    const parts = path.relative(manifestRoot, manifestPath).split(path.sep);
    const tag = parts[parts.length - 1];
    const name = parts[parts.length - 2];
    return name ? `${name}:${tag}` : tag;
  }
}

module.exports = OllamaSource;
