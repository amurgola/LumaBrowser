const PowerShellRunner = require('./PowerShellRunner');

class PcieAspm {
  static SUBGROUP_GUID = '501a4d13-42af-4429-9fd1-a8218c268e20';
  static SETTING_GUID = 'ee12f906-d010-4b5d-9e87-9d27a73cf906';
  static LABELS = { 0: 'Off', 1: 'Moderate power savings', 2: 'Maximum power savings' };

  static async read() {
    if (process.platform !== 'win32') return { available: false, reason: 'Windows only' };
    const result = await PowerShellRunner.run(`powercfg /q SCHEME_CURRENT ${PcieAspm._guids()}`);
    if (!result || !result.ok) return { available: false, reason: (result && result.reason) || 'powercfg query failed' };
    return PcieAspm.parse(result.stdout);
  }

  static async setOff() {
    if (process.platform !== 'win32') return { success: false, error: 'Windows only' };
    const result = await PowerShellRunner.run(PcieAspm._setOffScript());
    if (!result || !result.ok) return { success: false, error: PowerShellRunner.failureMessage(result, 'powercfg failed') };
    return { success: true, state: await PcieAspm.read() };
  }

  static parse(stdout) {
    const ac = PcieAspm._hexIndex(stdout, /Current AC Power Setting Index:\s*0x([0-9a-fA-F]+)/i);
    const dc = PcieAspm._hexIndex(stdout, /Current DC Power Setting Index:\s*0x([0-9a-fA-F]+)/i);
    if (ac == null && dc == null) return { available: false, reason: 'Could not parse powercfg output' };
    return {
      available: true,
      ac,
      dc,
      acLabel: PcieAspm._label(ac),
      dcLabel: PcieAspm._label(dc),
      alreadyOff: ac === 0 && dc === 0,
    };
  }

  static _setOffScript() {
    const guids = PcieAspm._guids();
    return [
      "$ErrorActionPreference = 'Stop'",
      'try {',
      `  powercfg /setacvalueindex SCHEME_CURRENT ${guids} 0`,
      '  if ($LASTEXITCODE -ne 0) { throw "setacvalueindex failed ($LASTEXITCODE)" }',
      `  powercfg /setdcvalueindex SCHEME_CURRENT ${guids} 0`,
      '  if ($LASTEXITCODE -ne 0) { throw "setdcvalueindex failed ($LASTEXITCODE)" }',
      '  powercfg /setactive SCHEME_CURRENT',
      '  if ($LASTEXITCODE -ne 0) { throw "setactive failed ($LASTEXITCODE)" }',
      "  Write-Output 'done'",
      '} catch {',
      '  [Console]::Error.WriteLine($_.Exception.Message)',
      '  exit 1',
      '}',
    ].join('\n');
  }

  static _guids() {
    return `${PcieAspm.SUBGROUP_GUID} ${PcieAspm.SETTING_GUID}`;
  }

  static _hexIndex(text, pattern) {
    const match = pattern.exec(text || '');
    return match ? parseInt(match[1], 16) : null;
  }

  static _label(value) {
    if (PcieAspm.LABELS[value]) return PcieAspm.LABELS[value];
    return value == null ? 'unknown' : `value ${value}`;
  }
}

module.exports = PcieAspm;
