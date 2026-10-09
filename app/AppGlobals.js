class AppGlobals {
  static NAMES = [
    '__LUMA_BOOT_START',
    '__lumaCliHandshake',
    '__lumaRagService',
    '__lumaDocsKnowledgeBase',
    '__lumaLlmServerService',
    '__lumaImageServerService',
    '__lumaGroundingServer',
    '__lumaImageRouter',
    '__lumaVideoRouter',
    '__lumaMusicRouter',
    '__lumaRpcLending',
    '__lumaSharingHostService',
    '__lumaSharingClientService',
    '__lumaLocalApiServer',
    '__lumaPlacementService',
    '__lumaTabPreview',
    '__lumaOnDemand',
    '__lumaResolutionCache',
    '__lumaVisualGrounding',
    '__lumaDesktop',
    '__lumaGames',
    '__lumaRuntimeTracer',
  ];

  static publish(name, value, target = global) {
    if (!AppGlobals.NAMES.includes(name)) throw new Error(`AppGlobals: unknown global ${name}`);
    target[name] = value;
    return value;
  }

  static read(name, target = global) {
    return target[name] || null;
  }
}

module.exports = AppGlobals;
