const CoreRequire = require('./CoreRequire');
const AudioCppRuntimeCatalog = require('./AudioCppRuntimeCatalog');

const RuntimeInstaller = CoreRequire.load('shared/runtime/RuntimeInstaller');

class AudioCppRuntimeInstaller extends RuntimeInstaller {
  static USER_AGENT = 'LumaBrowser-ChatterboxVoice';

  constructor(catalog = AudioCppRuntimeCatalog.shared, seams = {}) {
    super({ ...seams, catalog, userAgent: AudioCppRuntimeInstaller.USER_AGENT, expectedKind: AudioCppRuntimeCatalog.KIND, kindNoun: 'audio inference' });
  }
}

module.exports = AudioCppRuntimeInstaller;
