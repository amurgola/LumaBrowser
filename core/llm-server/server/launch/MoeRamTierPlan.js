const path = require('path');

class MoeRamTierPlan {
  static MIB = 1024 * 1024;

  static RAM_SHARE = 0.5;

  static MIN_BYTES = 4 * 1024 * MoeRamTierPlan.MIB;

  static REGISTER_SHARE = 0.2;

  static PROFILE_SUFFIX = '.moe-profile';

  static resolve({ flags, loading, moe, overrides, files, budget }) {
    const profilePath = MoeRamTierPlan._profilePath({ flags, moe, overrides, files });
    const off = MoeRamTierPlan._offReason({ flags, loading, moe, overrides });
    if (off) return MoeRamTierPlan._off(off, profilePath);
    const bytes = Math.min(Math.ceil(moe.moeSplit.expertBytes), Math.floor(loading.ramTotalBytes * MoeRamTierPlan.RAM_SHARE));
    if (bytes < MoeRamTierPlan.MIN_BYTES) return MoeRamTierPlan._off('too little RAM for a useful locked tier', profilePath);
    const mib = Math.floor(bytes / MoeRamTierPlan.MIB);
    const register = MoeRamTierPlan._register({ flags, loading, budget, bytes: mib * MoeRamTierPlan.MIB });
    return { enabled: true, bytes: mib * MoeRamTierPlan.MIB, mib, reason: null, profilePath, ...register };
  }

  static _off(reason, profilePath) {
    return { enabled: false, bytes: 0, mib: 0, reason, profilePath, registerMib: null, registerCards: 0 };
  }

  static _register({ flags, loading, budget, bytes }) {
    if (!flags.moeRamRegister) return { registerMib: null, registerCards: 0 };
    const cards = Math.max(1, ((budget && budget.perGpu) || []).filter((g) => g && !g.remote).length);
    const share = Math.floor((loading.ramTotalBytes * MoeRamTierPlan.REGISTER_SHARE) / cards);
    return { registerMib: Math.floor(Math.min(bytes, share) / MoeRamTierPlan.MIB), registerCards: cards };
  }

  static _offReason({ flags, loading, moe, overrides }) {
    if (!moe.cpuMoeEnabled || !moe.moeSplit) return 'no expert offload';
    if (!flags.moeTiers) return 'the runtime has no locked RAM tier (LumaByte runtime luma-b5 or newer)';
    if (overrides.noMoeRamTier) return 'turned off in Setup';
    if (!loading.moeNeedsMmap) return 'the expert pool fits RAM and is bulk-read instead';
    if (!(loading.ramTotalBytes > 0)) return 'system RAM size unknown';
    return null;
  }

  static _profilePath({ flags, moe, overrides, files }) {
    const dir = overrides && typeof overrides.moeProfileDir === 'string' ? overrides.moeProfileDir : '';
    if (!dir || !flags.moeTiers || !moe.cpuMoeEnabled || !(moe.gpuCache && moe.gpuCache.enabled)) return null;
    const base = path.basename(String(files.modelPath || 'model'), path.extname(String(files.modelPath || '')));
    return path.join(dir, base + MoeRamTierPlan.PROFILE_SUFFIX);
  }
}

module.exports = MoeRamTierPlan;
