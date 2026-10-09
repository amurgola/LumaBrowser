const CudaDeviceProbe = require('../../shared/runtime/CudaDeviceProbe');

class VaeTilingPolicy {
  static GB = 1024 * 1024 * 1024;
  static ROOMY_CARD_BYTES = 40 * VaeTilingPolicy.GB;
  static ENV_IMAGE = 'SD_EDIT_VAE_TILING';
  static ENV_VIDEO = 'SD_VIDEO_VAE_TILING';

  static decide({ model, profile, offloadToCpu, cudaDevice, diagnostics, env = process.env }) {
    const decided = VaeTilingPolicy._wanted(model, profile)
      && !VaeTilingPolicy._onRoomyCard(offloadToCpu, cudaDevice, diagnostics);
    return VaeTilingPolicy._envOverride(profile, env, decided);
  }

  static _wanted(model, profile) {
    return profile.isEdit || !!(model && model.supportsEdit) || profile.isWanVideo;
  }

  static _onRoomyCard(offloadToCpu, cudaDevice, diagnostics) {
    if (offloadToCpu || cudaDevice == null || cudaDevice === '') return false;
    try {
      const device = (CudaDeviceProbe.readDevices(diagnostics) || []).find((d) => String(d.index) === String(cudaDevice));
      return !!device && device.totalBytes >= VaeTilingPolicy.ROOMY_CARD_BYTES;
    } catch (_) {
      return false;
    }
  }

  static _envOverride(profile, env, decided) {
    const name = profile.isVideo ? VaeTilingPolicy.ENV_VIDEO : VaeTilingPolicy.ENV_IMAGE;
    const value = String((env && env[name]) || '').trim();
    if (value === '0') return false;
    if (value === '1') return true;
    return decided;
  }
}

module.exports = VaeTilingPolicy;
