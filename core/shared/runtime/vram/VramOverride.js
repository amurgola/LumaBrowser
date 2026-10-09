class VramOverride {
  static KEYS = {
    llm: 'core.llmServer.cudaDevice',
    music: 'core.musicServer.cudaDevice',
    grounding: 'core.groundingServer.cudaDevice',
  };

  static DEFAULT_KEY = 'core.imageServer.cudaDevice';

  static read(settingsDb, role) {
    const key = VramOverride.KEYS[role] || VramOverride.DEFAULT_KEY;
    try {
      const value = settingsDb && settingsDb.get ? settingsDb.get(key, null) : null;
      if (value === null || value === undefined) return undefined;
      return String(value).trim();
    } catch (_) {
      return undefined;
    }
  }

  static devices(value) {
    return value.split(',').map((s) => Number(s.trim())).filter((n) => Number.isInteger(n));
  }
}

module.exports = VramOverride;
