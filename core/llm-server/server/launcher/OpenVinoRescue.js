const OpenVinoDevice = require('../../runtimes/OpenVinoDevice');

class OpenVinoRescue {
  constructor({ finalizer, log }) {
    this._finalizer = finalizer;
    this._log = log;
  }

  async attempt(ctx, failure) {
    if (!failure || failure.kind !== 'openvino-device' || ctx.rpcAcquired) return null;
    if (!OpenVinoDevice.appliesTo(ctx.runtime && ctx.runtime.id)) return null;
    const failed = ctx.openvinoDevice;
    if (!failed || failed === OpenVinoDevice.CPU) return null;
    this._log.warn(`[llm-server] OpenVINO could not open its ${failed} device; retrying once on the CPU device.`);
    try { await ctx.runtimeServer.ensureStopped(); } catch (_) {}
    return this._retryOnCpu(ctx, failed);
  }

  async _retryOnCpu(ctx, failed) {
    ctx.openvinoDevice = OpenVinoDevice.CPU;
    const rescue = this._finalizer.finalize(ctx, ctx.plan({ diagnostics: ctx.planDiag }));
    if (rescue.plan && Array.isArray(rescue.plan.notes)) rescue.plan.notes.push(OpenVinoRescue.note(failed));
    await ctx.runtimeServer.start(rescue);
    ctx.syncQueue(rescue.plan);
    return ctx.succeed(rescue.plan, { openvinoRescue: failed });
  }

  static note(failed) {
    const fix = failed === OpenVinoDevice.NPU
      ? 'the Intel NPU user-space driver (intel-level-zero-npu) and the Level Zero loader (libze1)'
      : "Intel's OpenCL compute runtime (intel-opencl-icd on Ubuntu, intel-compute-runtime on Arch; Mesa's rusticl is not a substitute)";
    return `OpenVINO rescue: the ${failed} device could not be opened on the first start, so this launch runs OpenVINO on the CPU device. Install ${fix} to use the ${failed}.`;
  }
}

module.exports = OpenVinoRescue;
