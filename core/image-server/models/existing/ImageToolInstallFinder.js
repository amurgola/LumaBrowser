const path = require('path');
const ImageLibraryFs = require('./ImageLibraryFs');
const ImageToolInstallProbe = require('./ImageToolInstallProbe');
const ImageToolSearchRoots = require('./ImageToolSearchRoots');

class ImageToolInstallFinder {
  static INSTALL_NAME_RE = /comfy|stable[-_. ]?diffusion|sd[-_.]?webui|webui|forge|automatic|sd[-_.]?next|fooocus|swarmui|stabilitymatrix/i;

  static ROOTS_ENV = 'LUMA_IMAGE_LIBRARY_ROOTS';

  static find({ env, roots } = {}) {
    return new ImageToolInstallFinder(env || {}).execute(roots);
  }

  constructor(env) {
    this._env = env;
    this._installs = [];
    this._seen = new Set();
  }

  execute(roots) {
    const explicit = this._explicitRoots(roots);
    if (explicit) this._addExplicit(explicit);
    else this._discover();
    return this._installs;
  }

  _explicitRoots(roots) {
    if (Array.isArray(roots) && roots.length) return roots;
    const fromEnv = this._env[ImageToolInstallFinder.ROOTS_ENV];
    return fromEnv ? String(fromEnv).split(path.delimiter).filter(Boolean) : null;
  }

  _addExplicit(roots) {
    for (const root of roots) {
      if (!ImageLibraryFs.isDir(root)) continue;
      this._add(ImageToolInstallProbe.probe(root) || ImageToolInstallProbe.plainFolder(root));
    }
  }

  _discover() {
    this._addNamedFolders();
    this._addStabilityMatrix();
    for (const root of ImageToolSearchRoots.comfyConfiguredRoots(this._env, this._installs.map((i) => i.dir))) {
      this._add(ImageToolInstallProbe.probe(root));
    }
  }

  _addNamedFolders() {
    for (const parent of ImageToolSearchRoots.searchParents()) {
      this._probeIfNamed(parent);
      for (const child of ImageLibraryFs.listDirs(parent)) this._probeIfNamed(child);
    }
  }

  _addStabilityMatrix() {
    for (const smRoot of ImageToolSearchRoots.stabilityMatrixRoots(this._env)) {
      this._add(ImageToolInstallProbe.probe(smRoot));
      for (const pkg of ImageLibraryFs.listDirs(path.join(smRoot, 'Packages'))) this._add(ImageToolInstallProbe.probe(pkg));
    }
  }

  _probeIfNamed(dir) {
    if (ImageToolInstallFinder.INSTALL_NAME_RE.test(path.basename(dir))) this._add(ImageToolInstallProbe.probe(dir));
  }

  _add(install) {
    if (!install) return;
    const key = path.resolve(install.dir).toLowerCase();
    if (this._seen.has(key)) return;
    this._seen.add(key);
    this._installs.push(install);
  }
}

module.exports = ImageToolInstallFinder;
