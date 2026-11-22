const BasaltCatalog = require('./BasaltCatalog');
const CoreRequire = require('./CoreRequire');

const CompanionAssets = CoreRequire.load('shared/runtime/install/CompanionAssets');
const GithubReleaseClient = CoreRequire.load('shared/runtime/install/GithubReleaseClient');
const ReleaseAssetResolver = CoreRequire.load('shared/runtime/install/ReleaseAssetResolver');
const RuntimeInstallError = CoreRequire.load('shared/runtime/install/RuntimeInstallError');
const LlmRuntimeCatalog = CoreRequire.load('llm-server/runtimes/LlmRuntimeCatalog');
const LlmRuntimeInstaller = CoreRequire.load('llm-server/runtimes/LlmRuntimeInstaller');

class BasaltCudaCompanion {
  constructor({ entry, runtimesRoot, emit, catalog = LlmRuntimeCatalog.shared, http, companions } = {}) {
    this._entry = entry;
    this._runtimesRoot = runtimesRoot;
    this._emit = emit;
    this._catalog = catalog;
    const userAgent = LlmRuntimeInstaller.USER_AGENT;
    this._releases = new ReleaseAssetResolver(new GithubReleaseClient({ userAgent, http }));
    this._companions = companions || new CompanionAssets({ userAgent, http });
  }

  async fetchInto(destDir) {
    const { repo, pattern } = this._source();
    const { release } = await this._releases.resolve(repo, pattern);
    const outcomes = await this._companions.install({
      specs: [pattern], release, entry: this._entry, runtimesRoot: this._runtimesRoot, managedDir: destDir, emit: this._emit,
    });
    return outcomes[0] || null;
  }

  _source() {
    const cudaEntry = this._catalog.getById(BasaltCatalog.CUDA_RUNTIME_ID);
    const pattern = cudaEntry ? this._catalog.getCompanionAssetPatterns(cudaEntry)[0] : null;
    if (!pattern) {
      throw new RuntimeInstallError(`No CUDA 13 runtime download is known for ${process.platform}-${process.arch}; install a CUDA 13 toolkit and put its bin folder on PATH.`, 'CUDA_RUNTIME_UNAVAILABLE');
    }
    return { repo: this._catalog.getRepo(cudaEntry), pattern };
  }
}

module.exports = BasaltCudaCompanion;
