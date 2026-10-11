const DiagnosticsCommand = require('./DiagnosticsCommand');

class UnifiedMemoryProbe {
  static MIB = 1024 * 1024;
  static GIB = 1024 * UnifiedMemoryProbe.MIB;
  static LARGE_HOST_BYTES = 36 * UnifiedMemoryProbe.GIB;
  static SMALL_HOST_FRACTION = 2 / 3;
  static LARGE_HOST_FRACTION = 3 / 4;

  static applies(platform = process.platform, arch = process.arch) {
    return platform === 'darwin' && arch === 'arm64';
  }

  static async probe(totalRamBytes, { platform = process.platform, arch = process.arch, run = DiagnosticsCommand.run } = {}) {
    if (!UnifiedMemoryProbe.applies(platform, arch) || !(totalRamBytes > 0)) return null;
    const wiredLimitMb = await UnifiedMemoryProbe._wiredLimitMb(run);
    return UnifiedMemoryProbe.workingSet(totalRamBytes, wiredLimitMb);
  }

  static workingSet(totalRamBytes, wiredLimitMb = 0) {
    if (wiredLimitMb > 0) {
      return { bytes: Math.min(totalRamBytes, wiredLimitMb * UnifiedMemoryProbe.MIB), source: 'iogpu.wired_limit_mb' };
    }
    const fraction = totalRamBytes > UnifiedMemoryProbe.LARGE_HOST_BYTES
      ? UnifiedMemoryProbe.LARGE_HOST_FRACTION : UnifiedMemoryProbe.SMALL_HOST_FRACTION;
    return { bytes: Math.floor(totalRamBytes * fraction), source: 'unified-memory' };
  }

  static async _wiredLimitMb(run) {
    const result = await run('sysctl', ['-n', 'iogpu.wired_limit_mb']);
    const value = result && result.ok ? Number(String(result.stdout).trim()) : 0;
    return Number.isFinite(value) && value > 0 ? value : 0;
  }
}

module.exports = UnifiedMemoryProbe;
