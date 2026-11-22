const fs = require('fs');
const path = require('path');
const BasaltCatalog = require('./BasaltCatalog');
const CoreRequire = require('./CoreRequire');

const ManagedDir = CoreRequire.load('shared/runtime/install/ManagedDir');
const RuntimeInstallError = CoreRequire.load('shared/runtime/install/RuntimeInstallError');

class BasaltCudaRuntime {
  static SEARCH_DEPTH = 3;
  static DOWNLOAD_DIR = 'cuda13-download';

  static LIBRARY_PATTERNS = {
    win32: [/^cudart64_13\.dll$/i, /^cublas64_13\.dll$/i, /^cublasLt64_13\.dll$/i],
    linux: [/^libcudart\.so\.13(\.\d+)*$/, /^libcublas\.so\.13(\.\d+)*$/, /^libcublasLt\.so\.13(\.\d+)*$/],
  };

  constructor({ runtimesRoot, managedDir, binDir, emit, fetchCompanion, platform = process.platform }) {
    this._runtimesRoot = runtimesRoot;
    this._managedDir = managedDir;
    this._binDir = binDir;
    this._emit = emit;
    this._fetchCompanion = fetchCompanion;
    this._platform = platform;
    this._patterns = BasaltCudaRuntime.patternsFor(platform);
  }

  static patternsFor(platform) {
    return BasaltCudaRuntime.LIBRARY_PATTERNS[platform] || BasaltCudaRuntime.LIBRARY_PATTERNS.linux;
  }

  static missingIn(dir, platform = process.platform) {
    let names = [];
    try { names = fs.readdirSync(dir); } catch (_) { names = []; }
    return BasaltCudaRuntime.patternsFor(platform).filter((pattern) => !names.some((name) => pattern.test(name)));
  }

  async install() {
    if (BasaltCudaRuntime.missingIn(this._binDir, this._platform).length === 0) return { source: 'present', files: [] };
    const reused = await this._copyFromInstalledRuntime();
    if (reused) return { source: BasaltCatalog.CUDA_RUNTIME_ID, files: reused };
    return this._copyFromDownload();
  }

  async _copyFromInstalledRuntime() {
    const sourceDir = ManagedDir.pathFor(this._runtimesRoot, BasaltCatalog.CUDA_RUNTIME_ID);
    const found = this._findLibraries(sourceDir);
    if (!found) return null;
    this._emit('extract', { phase: 'progress', label: `copying the CUDA 13 libraries from ${BasaltCatalog.CUDA_RUNTIME_ID}` });
    return this._copyAll(found);
  }

  async _copyFromDownload() {
    const downloadDir = path.join(this._managedDir, BasaltCudaRuntime.DOWNLOAD_DIR);
    try {
      await this._fetchCompanion(downloadDir);
      const found = this._findLibraries(downloadDir);
      if (!found) throw new RuntimeInstallError('The CUDA 13 runtime archive did not contain cudart, cuBLAS and cuBLASLt.', 'CUDA_RUNTIME_INCOMPLETE');
      return { source: 'download', files: await this._copyAll(found) };
    } finally {
      fs.rmSync(downloadDir, { recursive: true, force: true });
    }
  }

  _findLibraries(dir) {
    const files = BasaltCudaRuntime._filesUnder(dir, BasaltCudaRuntime.SEARCH_DEPTH);
    const matched = this._patterns.map((pattern) => files.filter((file) => pattern.test(path.basename(file))));
    return matched.every((list) => list.length > 0) ? matched.flat() : null;
  }

  async _copyAll(files) {
    fs.mkdirSync(this._binDir, { recursive: true });
    const copied = [];
    for (const file of files) {
      const name = path.basename(file);
      await fs.promises.copyFile(file, path.join(this._binDir, name));
      copied.push(name);
    }
    return copied;
  }

  static _filesUnder(root, maxDepth) {
    const out = [];
    const queue = [{ dir: root, depth: 0 }];
    while (queue.length > 0) {
      const { dir, depth } = queue.shift();
      let entries = [];
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { entries = []; }
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (depth < maxDepth) queue.push({ dir: full, depth: depth + 1 });
        } else {
          out.push(full);
        }
      }
    }
    return out;
  }
}

module.exports = BasaltCudaRuntime;
