const fs = require('fs');
const path = require('path');
const AudioCppRuntimeCatalog = require('./AudioCppRuntimeCatalog');

class AudioCppInstallation {
  static SEARCH_DEPTH = 4;

  static findInstalledRuntime(runtimesRoot, preferredId = null, catalog = AudioCppRuntimeCatalog.shared) {
    for (const id of AudioCppInstallation._searchOrder(preferredId)) {
      const entry = catalog.getById(id);
      if (!entry) continue;
      const binaryPath = AudioCppInstallation.findRuntimeBinary(runtimesRoot, id, catalog);
      if (binaryPath) return { id, binaryPath, backend: entry.backend };
    }
    return null;
  }

  static findRuntimeBinary(runtimesRoot, id, catalog = AudioCppRuntimeCatalog.shared) {
    const entry = catalog.getById(id);
    if (!entry) return null;
    const dir = path.join(runtimesRoot, id);
    const manifest = AudioCppInstallation._readManifest(dir);
    if (manifest && manifest.binaryPath && fs.existsSync(manifest.binaryPath)) return manifest.binaryPath;
    return AudioCppInstallation.findBinaryIn(dir, catalog.getBinaryNames(entry), AudioCppInstallation.SEARCH_DEPTH);
  }

  static findBinaryIn(dir, names, maxDepth) {
    if (!names || !names.length) return null;
    const queue = [{ dir, depth: 0 }];
    while (queue.length) {
      const { dir: cur, depth } = queue.shift();
      const hit = AudioCppInstallation._fileIn(cur, names);
      if (hit) return hit;
      if (depth < maxDepth) for (const child of AudioCppInstallation._childDirs(cur)) queue.push({ dir: child, depth: depth + 1 });
    }
    return null;
  }

  static _searchOrder(preferredId) {
    const order = AudioCppRuntimeCatalog.PREFERENCE;
    return preferredId ? [preferredId, ...order.filter((x) => x !== preferredId)] : order;
  }

  static _readManifest(dir) {
    try { return JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')); } catch (_) { return null; }
  }

  static _fileIn(dir, names) {
    for (const name of names) {
      const candidate = path.join(dir, name);
      try { if (fs.statSync(candidate).isFile()) return candidate; } catch (_) {}
    }
    return null;
  }

  static _childDirs(dir) {
    try {
      return fs.readdirSync(dir, { withFileTypes: true }).filter((c) => c.isDirectory()).map((c) => path.join(dir, c.name));
    } catch (_) {
      return [];
    }
  }
}

module.exports = AudioCppInstallation;
