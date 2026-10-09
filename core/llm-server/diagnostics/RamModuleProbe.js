const DiagnosticsCommand = require('./DiagnosticsCommand');
const PowerShellRunner = require('./PowerShellRunner');
const PowerShellJson = require('./PowerShellJson');
const WindowsRamModuleParser = require('./WindowsRamModuleParser');
const RamModuleTextParser = require('./RamModuleTextParser');

class RamModuleProbe {
  static WINDOWS_SCRIPT =
    'Get-CimInstance Win32_PhysicalMemory | '
    + 'Select-Object Capacity, Speed, ConfiguredClockSpeed, Manufacturer, PartNumber, '
    + 'DeviceLocator, FormFactor, MemoryType, SMBIOSMemoryType | '
    + 'ConvertTo-Json -Compress -Depth 3';

  static async probe() {
    try {
      if (process.platform === 'win32') return await RamModuleProbe._probeWindows();
      if (process.platform === 'darwin') return await RamModuleProbe._probeMac();
      return await RamModuleProbe._probeLinux();
    } catch (err) {
      return RamModuleProbe._unavailable(err.message);
    }
  }

  static async _probeWindows() {
    const result = await PowerShellRunner.run(RamModuleProbe.WINDOWS_SCRIPT);
    if (!result || !result.ok) return RamModuleProbe._unavailable((result && result.reason) || 'PowerShell failed');
    const rows = PowerShellJson.parseRows(result.stdout);
    if (!rows) return RamModuleProbe._unavailable('Failed to parse Win32_PhysicalMemory JSON');
    if (!rows.length) return { available: true, modules: [] };
    return { available: true, source: 'win32_physicalmemory', modules: WindowsRamModuleParser.parseRows(rows) };
  }

  static async _probeMac() {
    const result = await DiagnosticsCommand.run('system_profiler', ['SPMemoryDataType']);
    if (!result.ok) return RamModuleProbe._unavailable(result.reason);
    return { available: true, source: 'system_profiler', modules: RamModuleTextParser.parseSystemProfiler(result.stdout) };
  }

  static async _probeLinux() {
    const result = await DiagnosticsCommand.run('dmidecode', ['-t', '17']);
    if (!result.ok) return RamModuleProbe._unavailable(RamModuleProbe._dmidecodeReason(result.reason));
    return { available: true, source: 'dmidecode', modules: RamModuleTextParser.parseDmidecode(result.stdout) };
  }

  static _dmidecodeReason(reason) {
    if (/denied|root|permitted/i.test(reason || '')) {
      return 'dmidecode requires elevated privileges (sudo) to read SMBIOS; RAM speed unavailable';
    }
    return reason || 'dmidecode unavailable';
  }

  static _unavailable(reason) {
    return { available: false, reason, modules: [] };
  }
}

module.exports = RamModuleProbe;
