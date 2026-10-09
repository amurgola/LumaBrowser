class TtsSynthesisRequest {
  static DEFAULT_SPEED = 1.0;

  static build(message, pocketVoices) {
    const sid = TtsSynthesisRequest._sid(message.sid);
    const speed = TtsSynthesisRequest._speed(message.speed);
    const request = { text: String(message.text || ''), sid, speed };
    if (pocketVoices) TtsSynthesisRequest._applyPocketVoice(request, pocketVoices.voiceFor(sid), pocketVoices.numSteps);
    return request;
  }

  static _applyPocketVoice(request, voice, numSteps) {
    request.generationConfig = {
      speed: request.speed,
      referenceAudio: voice.samples,
      referenceSampleRate: voice.sampleRate,
      numSteps,
    };
    request.sid = 0;
  }

  static _sid(value) {
    return Number.isFinite(value) ? Number(value) : 0;
  }

  static _speed(value) {
    return Number(value) > 0 ? Number(value) : TtsSynthesisRequest.DEFAULT_SPEED;
  }
}

module.exports = TtsSynthesisRequest;
