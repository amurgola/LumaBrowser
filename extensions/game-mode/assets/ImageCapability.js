const CoreRequire = require('../CoreRequire');

class ImageCapability {
  static isReady(chat) {
    try {
      return !!(chat && typeof chat.isImageReady === 'function' && chat.isImageReady());
    } catch (_) { return false; }
  }

  static canGenerateInline(chat) {
    try {
      if (!ImageCapability.isReady(chat)) return false;
      return CoreRequire.load('shared/runtime/CudaDeviceProbe').gpuCount() >= 2;
    } catch (_) { return false; }
  }

  static async nativeSize(chat, modelRef) {
    try {
      if (!chat || typeof chat.imageNativeSize !== 'function') return null;
      const r = await chat.imageNativeSize(modelRef || null);
      return r && Number(r.width) > 0 && Number(r.height) > 0 ? { width: Number(r.width), height: Number(r.height) } : null;
    } catch (_) { return null; }
  }

  static async beginExclusive(chat) {
    try { if (typeof chat.beginExclusiveImage === 'function') await chat.beginExclusiveImage(); } catch (_) {}
  }

  static endExclusive(chat) {
    try { if (typeof chat.endExclusiveImage === 'function') chat.endExclusiveImage(); } catch (_) {}
  }
}

module.exports = ImageCapability;
