class ModelNameToken {
  static QUANT = /^I?Q\d[\dA-Z_]*$/i;

  static FORMATS = [/^(MX)?FP\d+$/i, /^(F16|BF16|F32)$/i];

  static NOISE = [
    ModelNameToken.QUANT,
    ...ModelNameToken.FORMATS,
    /^INT[48]$/i,
    /^GG(UF|ML)$/i,
    /^(instruct|chat|it|base|hf|sft|dpo)$/i,
  ];

  static ACRONYMS = {
    oss: 'OSS', moe: 'MoE', vl: 'VL', ai: 'AI', sd: 'SD',
    tts: 'TTS', stt: 'STT', rl: 'RL', vlm: 'VLM',
  };

  static isNoise(token) {
    return ModelNameToken.NOISE.some((re) => re.test(token));
  }

  static isQuantOrFormat(token) {
    return ModelNameToken.QUANT.test(token) || ModelNameToken.FORMATS.some((re) => re.test(token));
  }

  static style(token) {
    const size = token.match(/^(\d+(?:\.\d+)?)([kmbt])$/i);
    if (size) return size[1] + size[2].toUpperCase();
    const glued = token.match(/^([A-Za-z]{3,})([\d.]+[\w.]*)$/);
    if (glued) return ModelNameToken.style(glued[1]) + ' ' + glued[2];
    if (/^[a-z]+$/.test(token)) return ModelNameToken.ACRONYMS[token] || (token.charAt(0).toUpperCase() + token.slice(1));
    return token;
  }
}

module.exports = ModelNameToken;
