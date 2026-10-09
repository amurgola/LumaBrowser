class VoiceAudioInput {
  static MIN_BYTES = 100;

  static read(req) {
    let language = typeof req.query.language === 'string' ? req.query.language : undefined;
    if (Buffer.isBuffer(req.body)) return { wav: req.body, language };
    if (!req.body || typeof req.body.wav !== 'string') return { wav: null, language };
    if (typeof req.body.language === 'string') language = req.body.language;
    return { wav: Buffer.from(req.body.wav, 'base64'), language };
  }

  static isUsable(wav) {
    return !!wav && wav.length >= VoiceAudioInput.MIN_BYTES;
  }
}

module.exports = VoiceAudioInput;
