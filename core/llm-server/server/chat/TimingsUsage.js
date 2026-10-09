class TimingsUsage {
  static fromTimings(timings) {
    if (!timings) return null;
    const prompt = TimingsUsage._count(timings.prompt_n);
    const completion = TimingsUsage._count(timings.predicted_n);
    if (prompt === null && completion === null) return null;
    return TimingsUsage._usage(prompt || 0, completion || 0);
  }

  static _count(value) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  static _usage(promptTokens, completionTokens) {
    return {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    };
  }
}

module.exports = TimingsUsage;
