const fs = require('fs');
const path = require('path');
const ImageLibraryFs = require('./ImageLibraryFs');
const ImageToolInstallFinder = require('./ImageToolInstallFinder');
const ImageToolInstallProbe = require('./ImageToolInstallProbe');
const CheckpointClassifier = require('./CheckpointClassifier');

class ExistingImageLibraryScanner {
  static MAX_DEPTH = 3;
  static MIN_MODEL_BYTES = 64 * 1024 * 1024;
  static WEIGHT_RE = /\.(safetensors|ckpt|gguf)$/i;

  static scan({ modelsDir, roots, env } = {}) {
    return new ExistingImageLibraryScanner(modelsDir).execute(ImageToolInstallFinder.find({ env: env || process.env, roots }));
  }

  constructor(modelsDir) {
    this._own = ExistingImageLibraryScanner._ownLibraryIndex(modelsDir);
    this._ownRoot = modelsDir ? path.resolve(modelsDir).toLowerCase() + path.sep : null;
    this._seen = new Set();
    this._models = [];
    this._skipped = [];
  }

  execute(installs) {
    for (const install of installs) this._scanInstall(install);
    return this._result(installs);
  }

  _scanInstall(install) {
    for (const folder of install.folders) {
      for (const hit of ExistingImageLibraryScanner._walkWeights(folder.dir, 0, [])) this._consider(install, folder, hit);
    }
  }

  _consider(install, folder, hit) {
    const realPath = ImageLibraryFs.realPathOr(hit.path, hit.path);
    const key = realPath.toLowerCase();
    if (this._seen.has(key)) return;
    this._seen.add(key);
    if (this._ownRoot && key.startsWith(this._ownRoot)) return;
    const verdict = CheckpointClassifier.classify(hit.path, { allInOne: folder.allInOne });
    const record = ExistingImageLibraryScanner._record(install, hit, realPath, key, verdict);
    if (verdict.compatible) this._models.push(this._compatibleRecord(record, verdict, hit));
    else this._skipped.push({ ...record, reason: verdict.reason });
  }

  _compatibleRecord(record, verdict, hit) {
    return {
      ...record,
      baseType: verdict.baseType,
      ...(verdict.promptStyle ? { promptStyle: verdict.promptStyle } : {}),
      ...(verdict.guessed ? { guessed: true } : {}),
      adopted: this._isAdopted(record.id, hit.path),
    };
  }

  _isAdopted(key, filePath) {
    if (this._own.real.has(key)) return true;
    const st = ImageLibraryFs.statOrNull(filePath);
    return !!(st && st.ino && this._own.inodes.has(`${st.dev}:${st.ino}`));
  }

  _result(installs) {
    this._models.sort((a, b) => b.bytes - a.bytes);
    this._skipped.sort((a, b) => b.bytes - a.bytes);
    const sources = {};
    for (const m of this._models) sources[m.source] = (sources[m.source] || 0) + 1;
    return {
      models: this._models,
      skipped: this._skipped,
      sources,
      installs: installs.map((i) => ({ tool: i.tool, label: ImageToolInstallProbe.labelFor(i.tool), dir: i.dir })),
    };
  }

  static _record(install, hit, realPath, key, verdict) {
    return {
      id: key,
      source: install.tool,
      sourceLabel: ImageToolInstallProbe.labelFor(install.tool),
      installDir: install.dir,
      name: hit.file.replace(ExistingImageLibraryScanner.WEIGHT_RE, ''),
      file: hit.file,
      path: hit.path,
      realPath,
      bytes: hit.bytes,
      archLabel: verdict.archLabel,
    };
  }

  static _walkWeights(root, depth, out) {
    if (depth > ExistingImageLibraryScanner.MAX_DEPTH) return out;
    let entries;
    try {
      entries = fs.readdirSync(root, { withFileTypes: true });
    } catch (_) {
      return out;
    }
    for (const entry of entries) ExistingImageLibraryScanner._visit(path.join(root, entry.name), entry.name, depth, out);
    return out;
  }

  static _visit(full, name, depth, out) {
    const st = ImageLibraryFs.statOrNull(full);
    if (!st) return;
    if (st.isDirectory()) ExistingImageLibraryScanner._walkWeights(full, depth + 1, out);
    else if (st.isFile() && ExistingImageLibraryScanner.WEIGHT_RE.test(name) && st.size >= ExistingImageLibraryScanner.MIN_MODEL_BYTES) {
      out.push({ path: full, bytes: st.size, file: name });
    }
  }

  static _ownLibraryIndex(modelsDir) {
    const index = { real: new Set(), inodes: new Set() };
    if (!modelsDir) return index;
    for (const dir of ImageLibraryFs.listDirs(modelsDir)) {
      for (const name of ExistingImageLibraryScanner._readNames(dir)) {
        if (ExistingImageLibraryScanner.WEIGHT_RE.test(name)) ExistingImageLibraryScanner._indexFile(path.join(dir, name), index);
      }
    }
    return index;
  }

  static _indexFile(full, index) {
    const real = ImageLibraryFs.realPathOr(full, null);
    if (real) index.real.add(real.toLowerCase());
    const st = ImageLibraryFs.statOrNull(full);
    if (st && st.ino) index.inodes.add(`${st.dev}:${st.ino}`);
  }

  static _readNames(dir) {
    try {
      return fs.readdirSync(dir);
    } catch (_) {
      return [];
    }
  }
}

module.exports = ExistingImageLibraryScanner;
