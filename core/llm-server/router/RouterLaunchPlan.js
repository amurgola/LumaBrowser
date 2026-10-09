class RouterLaunchPlan {
  static RUNTIME_PREFERENCE = Object.freeze(['llama-cpp-luma', 'llama-cpp-cpu', 'llama-cpp-cuda13', 'llama-cpp-cuda12']);
  static CONTEXT = 4096;
  static HEALTH_TIMEOUT_MS = 60 * 1000;
  static HIDE_ALL_GPUS = '-1';

  static pickRuntime(runtimes, defaultRuntimeId) {
    const usable = (runtimes || []).filter((r) => r && r.installed && r.binaryPath && /^llama-cpp/.test(r.id));
    if (!usable.length) throw new Error('No llama.cpp runtime is installed.');
    for (const id of RouterLaunchPlan.RUNTIME_PREFERENCE) {
      const hit = usable.find((r) => r.id === id);
      if (hit) return hit;
    }
    return usable.find((r) => r.id === defaultRuntimeId) || usable[0];
  }

  static threads(cpuCount) {
    return Math.max(2, Math.min(8, Math.floor((cpuCount || 0) / 2) || 2));
  }

  static buildArgs({ modelPath, port, threads }) {
    return [
      '-m', modelPath,
      '--host', '127.0.0.1', '--port', String(port),
      '-ngl', '0',
      '-c', String(RouterLaunchPlan.CONTEXT),
      '-np', '1',
      '-t', String(threads),
    ];
  }

  static build({ runtime, modelPath, port, cpuCount }) {
    return {
      binaryPath: runtime.binaryPath,
      args: RouterLaunchPlan.buildArgs({ modelPath, port, threads: RouterLaunchPlan.threads(cpuCount) }),
      plan: { port },
      healthTimeoutMs: RouterLaunchPlan.HEALTH_TIMEOUT_MS,
      cudaDevice: RouterLaunchPlan.HIDE_ALL_GPUS,
    };
  }
}

module.exports = RouterLaunchPlan;
