class PitchEstimator {
  static WINDOW_SEC = 0.04;
  static HOP_SEC = 0.02;
  static MIN_HZ = 60;
  static MAX_HZ = 400;
  static MIN_ENERGY = 1e-4;
  static VOICED_CORRELATION = 0.6;
  static OCTAVE_TOLERANCE = 0.9;

  static medianF0(samples, rate) {
    const f0s = PitchEstimator._frameF0s(samples, rate).sort((a, b) => a - b);
    return { medianHz: f0s.length ? Math.round(f0s[Math.floor(f0s.length / 2)]) : 0, voicedFrames: f0s.length };
  }

  static _frameF0s(samples, rate) {
    const P = PitchEstimator;
    const win = Math.round(rate * P.WINDOW_SEC);
    const hop = Math.round(rate * P.HOP_SEC);
    const lags = { min: Math.round(rate / P.MAX_HZ), max: Math.round(rate / P.MIN_HZ) };
    const f0s = [];
    for (let s = 0; s + win < samples.length; s += hop) {
      const lag = P._frameLag(samples, s, win, lags);
      if (lag) f0s.push(rate / lag);
    }
    return f0s;
  }

  static _frameLag(samples, start, win, lags) {
    let energy = 0;
    for (let i = 0; i < win; i++) energy += samples[start + i] * samples[start + i];
    energy /= win;
    if (energy < PitchEstimator.MIN_ENERGY) return 0;
    const { corr, best } = PitchEstimator._correlate(samples, start, win, lags, energy);
    if (best <= PitchEstimator.VOICED_CORRELATION) return 0;
    return PitchEstimator._shortestPeak(corr, best, lags);
  }

  static _correlate(samples, start, win, lags, energy) {
    const corr = new Float32Array(lags.max + 1);
    let best = 0;
    for (let lag = lags.min; lag <= lags.max; lag++) {
      let c = 0;
      for (let i = 0; i < win - lag; i++) c += samples[start + i] * samples[start + i + lag];
      c /= (win - lag) * energy;
      corr[lag] = c;
      if (c > best) best = c;
    }
    return { corr, best };
  }

  static _shortestPeak(corr, best, lags) {
    for (let lag = lags.min + 1; lag < lags.max; lag++) {
      if (corr[lag] >= best * PitchEstimator.OCTAVE_TOLERANCE && corr[lag] >= corr[lag - 1] && corr[lag] >= corr[lag + 1]) return lag;
    }
    return 0;
  }
}

module.exports = PitchEstimator;
