class GpuHeadroom {
  static SETTING_KEY = 'core.llm.gpuHeadroomBytes';

  static GIB = 1024 * 1024 * 1024;

  static DEFAULT_BYTES = GpuHeadroom.GIB;

  static MIN_BYTES = 256 * 1024 * 1024;

  static MAX_BYTES = 16 * GpuHeadroom.GIB;

  static _bytes = GpuHeadroom.DEFAULT_BYTES;

  static bytes() {
    return GpuHeadroom._bytes;
  }

  static normalize(value) {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n) || n < GpuHeadroom.MIN_BYTES || n > GpuHeadroom.MAX_BYTES) return GpuHeadroom.DEFAULT_BYTES;
    return n;
  }

  static set(value) {
    GpuHeadroom._bytes = GpuHeadroom.normalize(value);
    return GpuHeadroom._bytes;
  }

  static load(settingsDb) {
    const stored = settingsDb && typeof settingsDb.get === 'function' ? settingsDb.get(GpuHeadroom.SETTING_KEY, null) : null;
    return GpuHeadroom.set(stored == null ? GpuHeadroom.DEFAULT_BYTES : stored);
  }

  static save(settingsDb, value) {
    const bytes = GpuHeadroom.set(value);
    if (settingsDb) {
      if (bytes === GpuHeadroom.DEFAULT_BYTES) settingsDb.delete(GpuHeadroom.SETTING_KEY);
      else settingsDb.set(GpuHeadroom.SETTING_KEY, bytes);
    }
    return bytes;
  }
}

module.exports = GpuHeadroom;
