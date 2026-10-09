class SherpaWorkerEnv {
  static LIBRARY_PATH_VAR = { linux: 'LD_LIBRARY_PATH', darwin: 'DYLD_LIBRARY_PATH' };

  static build(platformDir, { platform = process.platform, baseEnv = process.env } = {}) {
    const env = { ...baseEnv };
    const variable = SherpaWorkerEnv.LIBRARY_PATH_VAR[platform];
    if (variable && platformDir) env[variable] = SherpaWorkerEnv._prepend(platformDir, env[variable]);
    return env;
  }

  static _prepend(dir, existing) {
    return existing ? `${dir}:${existing}` : dir;
  }
}

module.exports = SherpaWorkerEnv;
