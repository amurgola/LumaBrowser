const DiagnosticsCommand = require('../../llm-server/diagnostics/DiagnosticsCommand');

class GpuProcessMemory {
  static TIMEOUT_MS = 15000;
  static SCRIPT = (pid) => `(Get-Counter -Counter ('\\GPU Process Memory(pid_${pid}_*)\\Dedicated Usage'), `
    + `('\\GPU Process Memory(pid_${pid}_*)\\Shared Usage') -ErrorAction Stop).CounterSamples `
    + `| ForEach-Object { $_.Path + '|' + [int64]$_.CookedValue }`;

  static applies(platform = process.platform) {
    return platform === 'win32';
  }

  static async read(pid, { platform = process.platform, run = DiagnosticsCommand.run } = {}) {
    if (!pid || !GpuProcessMemory.applies(platform)) return null;
    const result = await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', GpuProcessMemory.SCRIPT(Number(pid))], GpuProcessMemory.TIMEOUT_MS);
    if (!result || !result.ok) return null;
    return GpuProcessMemory.parse(result.stdout);
  }

  static parse(stdout) {
    let dedicated = 0; let shared = 0; let seen = false;
    for (const line of String(stdout || '').split(/\r?\n/)) {
      const match = /\\(dedicated usage|shared usage)\|(-?\d+)\s*$/i.exec(line.trim());
      if (!match) continue;
      seen = true;
      const bytes = Math.max(0, Number(match[2]) || 0);
      if (/^dedicated/i.test(match[1])) dedicated += bytes; else shared += bytes;
    }
    return seen ? { dedicatedBytes: dedicated, sharedBytes: shared, totalBytes: dedicated + shared } : null;
  }
}

module.exports = GpuProcessMemory;
