class AiCallOptions {
  static DEFAULT_TIMEOUT_MS = 120000;
  static MIN_TIMEOUT_MS = 5000;
  static MAX_TIMEOUT_MS = 300000;
  static DEFAULT_TEMPERATURE = 0.8;
  static MAX_TEMPERATURE = 1.5;

  static from(body, fallbackModelRef) {
    const modelRef = body.modelRef ? String(body.modelRef) : fallbackModelRef;
    return {
      temperature: AiCallOptions.clampTemperature(body.temperature),
      timeoutMs: AiCallOptions.clampTimeout(body.timeoutMs),
      noThink: body.think !== true,
      ...(modelRef ? { modelRef } : {}),
    };
  }

  static clampTemperature(t) {
    const n = Number(t);
    if (!Number.isFinite(n)) return AiCallOptions.DEFAULT_TEMPERATURE;
    return Math.max(0, Math.min(AiCallOptions.MAX_TEMPERATURE, n));
  }

  static clampTimeout(t) {
    const n = Number(t);
    if (!Number.isFinite(n) || n <= 0) return AiCallOptions.DEFAULT_TIMEOUT_MS;
    return Math.max(AiCallOptions.MIN_TIMEOUT_MS, Math.min(AiCallOptions.MAX_TIMEOUT_MS, Math.floor(n)));
  }
}

module.exports = AiCallOptions;
