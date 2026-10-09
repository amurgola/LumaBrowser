class IkLlamaAssetPatterns {
  static assetPatternsFor(backend, isa) {
    const P = IkLlamaAssetPatterns;
    switch (backend) {
      case 'cpu':
        return {
          'win32-x64': P._mainAsset('win', 'cpu', isa),
          'linux-x64': P._mainAsset('ubuntu', null, isa),
          'darwin-arm64': P._mainAsset('macos-arm64', null, isa),
          'darwin-x64': P._mainAsset('macos', null, isa),
        };
      case 'vulkan':
        return { 'linux-x64': P._mainAsset('ubuntu', 'vulkan', isa) };
      case 'cuda12':
      case 'cuda13': {
        const cuda = P._cudaToken(P._cudaMajor(backend));
        return {
          'win32-x64': P._mainAsset('win', cuda, isa),
          'linux-x64': P._mainAsset('ubuntu', cuda, isa),
        };
      }
      default:
        throw new Error(`ik-llama-runtime: unknown backend ${backend}`);
    }
  }

  static companionPatternsFor(backend, isa) {
    if (backend !== 'cuda12' && backend !== 'cuda13') return undefined;
    const major = IkLlamaAssetPatterns._cudaMajor(backend);
    return {
      'win32-x64': IkLlamaAssetPatterns._cudartAsset('win', major, isa),
      'linux-x64': IkLlamaAssetPatterns._cudartAsset('ubuntu', major, isa),
    };
  }

  static _cudaMajor(backend) {
    return backend === 'cuda12' ? 12 : 13;
  }

  static _mainAsset(osToken, backendToken, isa) {
    const esc = IkLlamaAssetPatterns._escape;
    const tail = osToken === 'macos-arm64' ? '' : `-x64-${esc(isa)}`;
    const be = backendToken ? `-${backendToken}` : '';
    return new RegExp(`^ik_llama-main-.+-bin-${esc(osToken)}${be}${tail}\\.zip$`, 'i');
  }

  static _cudartAsset(osToken, cudaMajor, isa) {
    const esc = IkLlamaAssetPatterns._escape;
    return new RegExp(`^ik_llama-cudart-main-.+-bin-${esc(osToken)}-${IkLlamaAssetPatterns._cudaToken(cudaMajor)}-x64-${esc(isa)}\\.zip$`, 'i');
  }

  static _cudaToken(major) {
    return `cuda-${major}(?:\\.\\d+)?`;
  }

  static _escape(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = IkLlamaAssetPatterns;
