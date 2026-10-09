const RuntimeInstaller = require('../../shared/runtime/RuntimeInstaller');
const LlmRuntimeCatalog = require('./LlmRuntimeCatalog');

class LlmRuntimeInstaller extends RuntimeInstaller {
  static USER_AGENT = 'LumaBrowser-LLMServer';

  static shared = new LlmRuntimeInstaller();

  constructor({ catalog = LlmRuntimeCatalog.shared, http, sysdeps, extractor } = {}) {
    super({ catalog, userAgent: LlmRuntimeInstaller.USER_AGENT, expectedKind: 'inference', kindNoun: 'inference', http, sysdeps, extractor });
  }
}

module.exports = LlmRuntimeInstaller;
