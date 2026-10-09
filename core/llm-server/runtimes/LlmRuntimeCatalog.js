const RuntimeCatalog = require('../../shared/runtime/RuntimeCatalog');
const RuntimeCatalogRegistry = require('./RuntimeCatalogRegistry');
const LlmRuntimeDeclarations = require('./LlmRuntimeDeclarations');

class LlmRuntimeCatalog extends RuntimeCatalog {
  static EXTENSION_FINGERPRINT_LENGTH = 8;

  static shared = new LlmRuntimeCatalog();

  constructor(registry = RuntimeCatalogRegistry.shared, runtimes = LlmRuntimeDeclarations.RUNTIMES) {
    super(runtimes);
    this._registry = registry;
  }

  getCatalog() {
    const extra = this._registry.list();
    return extra.length === 0 ? this._runtimes : this._runtimes.concat(extra);
  }

  getById(id) {
    return super.getById(id) || this._registry.getById(id) || null;
  }

  fingerprint() {
    const base = super.fingerprint();
    const extra = this._registry.list();
    if (extra.length === 0) return base;
    return `${base}+${RuntimeCatalog.hashDeclaration(extra, LlmRuntimeCatalog.EXTENSION_FINGERPRINT_LENGTH)}`;
  }

  getExtensionHooks(id) {
    return this._registry.hooksFor(id);
  }

  cudaRuntimePreference(cudaVersion) {
    const match = String(cudaVersion || '').match(/^(\d+)/);
    const major = match ? Number(match[1]) : null;
    return major != null && major >= 13 ? ['llama-cpp-cuda13', 'llama-cpp-cuda12'] : ['llama-cpp-cuda12'];
  }
}

module.exports = LlmRuntimeCatalog;
