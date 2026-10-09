class BuildHooks {
  static TS_LIB_DTS = /[\\/]node_modules[\\/]typescript[\\/]lib[\\/]lib\.[^\\/]*\.d\.ts$/;

  static onNodeModuleFile(filePath) {
    return BuildHooks.TS_LIB_DTS.test(String(filePath || ''));
  }
}

module.exports = BuildHooks;
