const CudaDeviceProbe = require('../../shared/runtime/CudaDeviceProbe');

class SageAttentionPolicy {
  static FLAG = '--sage-attn';
  static MIN_COMPUTE_CAPABILITY = 8.0;
  static ENV = 'SD_SAGE_ATTN';
  static CUDA_RUNTIME = /cuda|luma/i;

  static async decide({ model, runtime, cudaDevice, diagnostics, supportsFlag, env = process.env }) {
    const forced = SageAttentionPolicy._envOverride(env);
    if (forced === false) return SageAttentionPolicy._off(`${SageAttentionPolicy.ENV}=0`);
    if (forced !== true && !(model && model.sageAttention === true)) return { sageAttention: false, note: null };
    const refusal = SageAttentionPolicy._refusal({ runtime, cudaDevice, diagnostics });
    if (refusal) return SageAttentionPolicy._off(refusal);
    if (!(await SageAttentionPolicy._supported(supportsFlag))) return SageAttentionPolicy._off('this build has no --sage-attn');
    return { sageAttention: true, note: `SageAttention on${forced ? ` (${SageAttentionPolicy.ENV}=1)` : ''}` };
  }

  static _refusal({ runtime, cudaDevice, diagnostics }) {
    if (!SageAttentionPolicy.CUDA_RUNTIME.test(String((runtime && runtime.id) || ''))) return 'not a CUDA runtime';
    const cards = SageAttentionPolicy._pinnedCards(cudaDevice, diagnostics);
    if (!cards.length) return 'no CUDA card reading';
    for (const card of cards) {
      const cc = SageAttentionPolicy._computeCapability(card);
      if (cc == null) return `compute capability of card ${card.index} unknown`;
      if (cc < SageAttentionPolicy.MIN_COMPUTE_CAPABILITY) return `card ${card.index} is compute capability ${cc}`;
    }
    return null;
  }

  static _pinnedCards(cudaDevice, diagnostics) {
    const all = CudaDeviceProbe.diagnosticsDevices(diagnostics) || [];
    const pinned = String(cudaDevice == null ? '' : cudaDevice).split(',').map((s) => s.trim()).filter(Boolean);
    if (!pinned.length) return all;
    return pinned.map((idx) => all.find((d) => String(d.index) === idx)).filter(Boolean);
  }

  static _computeCapability(card) {
    const value = parseFloat(card && card.computeCapability);
    return Number.isFinite(value) ? value : null;
  }

  static async _supported(supportsFlag) {
    try {
      return typeof supportsFlag === 'function' ? !!(await supportsFlag(SageAttentionPolicy.FLAG)) : false;
    } catch (_) {
      return false;
    }
  }

  static _envOverride(env) {
    const value = String((env && env[SageAttentionPolicy.ENV]) || '').trim();
    if (value === '0') return false;
    if (value === '1') return true;
    return null;
  }

  static _off(why) {
    return { sageAttention: false, note: `SageAttention off: ${why}` };
  }
}

module.exports = SageAttentionPolicy;
