const path = require('path');
const DiagnosticsCommand = require('./DiagnosticsCommand');

class PowerShellRunner {
  static SYSTEM_ROOT = process.env.SystemRoot || 'C:\\Windows';

  static CANDIDATES = [
    'pwsh.exe',
    'powershell.exe',
    path.join(PowerShellRunner.SYSTEM_ROOT, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'),
    path.join(PowerShellRunner.SYSTEM_ROOT, 'SysWOW64', 'WindowsPowerShell', 'v1.0', 'powershell.exe'),
  ];

  static async run(script, timeoutMs) {
    let lastReason = null;
    for (const exe of PowerShellRunner.CANDIDATES) {
      const result = await DiagnosticsCommand.run(exe, ['-NoProfile', '-NonInteractive', '-Command', script], timeoutMs);
      if (result.ok || !DiagnosticsCommand.isBinaryMissing(result.reason)) return result;
      lastReason = result.reason;
    }
    return { ok: false, reason: lastReason || 'No PowerShell candidate available' };
  }

  static quote(text) {
    return String(text).replace(/'/g, "''");
  }

  static failureMessage(result, fallback) {
    return (result && result.stderr && result.stderr.trim()) || (result && result.reason) || fallback;
  }
}

module.exports = PowerShellRunner;
