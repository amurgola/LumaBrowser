class ClipPlacement {
  static ENV = 'SD_CLIP_ON_CPU';

  static decide({ model, cudaDevice, offloadToCpu, autoFit, cpuOnly = false, env = process.env }) {
    if (!ClipPlacement._asksForCpuEncoders(model)) return { clipOnCpu: undefined, note: null };
    if (cpuOnly) return ClipPlacement._keep('CPU runtime');
    if (ClipPlacement._forcedByEnv(env)) return ClipPlacement._keep(`${ClipPlacement.ENV}=1`);
    return ClipPlacement._onGpu(ClipPlacement._why({ cudaDevice, offloadToCpu, autoFit }));
  }

  static _asksForCpuEncoders(model) {
    return Array.isArray(model && model.launchArgs) && model.launchArgs.includes('--clip-on-cpu');
  }

  static _forcedByEnv(env) {
    return String((env && env[ClipPlacement.ENV]) || '').trim() === '1';
  }

  static _why({ cudaDevice, offloadToCpu, autoFit }) {
    if (autoFit) return 'the VRAM budget streams what the card cannot hold';
    if (offloadToCpu) return 'offloaded weights are staged into VRAM per module';
    if (cudaDevice == null || cudaDevice === '') return 'sd-server places them on the card it finds';
    return `card ${cudaDevice} runs the conditioner`;
  }

  static _keep(why) {
    return { clipOnCpu: true, note: `text encoders on CPU: ${why}` };
  }

  static _onGpu(why) {
    return { clipOnCpu: false, note: `text encoders on GPU: ${why}` };
  }
}

module.exports = ClipPlacement;
