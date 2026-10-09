const fs = require('fs');
const DiagnosticsCommand = require('./DiagnosticsCommand');
const PowerShellRunner = require('./PowerShellRunner');
const PowerShellJson = require('./PowerShellJson');
const DiskTableParser = require('./DiskTableParser');

class DiskProbe {
  static POWERSHELL_SCRIPT =
    'Get-CimInstance Win32_LogicalDisk | '
    + 'Where-Object { $_.Size -gt 0 } | '
    + 'Select-Object DeviceID,VolumeName,Size,FreeSpace,FileSystem,DriveType | '
    + 'ConvertTo-Json -Compress';

  static WMIC_ARGS = ['logicaldisk', 'get', 'Caption,VolumeName,Size,FreeSpace,FileSystem,DriveType', '/format:csv'];

  static async probe() {
    try {
      if (process.platform === 'win32') return await DiskProbe._probeWindows();
      return await DiskProbe._probePosix();
    } catch (err) {
      return { available: false, reason: err.message, volumes: [] };
    }
  }

  static async _probeWindows() {
    const powershell = await PowerShellRunner.run(DiskProbe.POWERSHELL_SCRIPT);
    const fromPowerShell = DiskProbe._fromPowerShell(powershell);
    if (fromPowerShell) return fromPowerShell;
    const wmic = await DiagnosticsCommand.run('wmic', DiskProbe.WMIC_ARGS);
    const wmicVolumes = wmic.ok ? DiskTableParser.parseWmicCsv(wmic.stdout) : [];
    if (wmicVolumes.length) return { available: true, source: 'wmic', volumes: wmicVolumes };
    const sweep = await DiskProbe._sweepDriveLetters();
    if (sweep.length) return { available: true, source: 'node-statfs', volumes: sweep };
    return {
      available: false,
      reason: (powershell && powershell.reason) || wmic.reason || 'No disk-probe method succeeded',
      volumes: [],
    };
  }

  static _fromPowerShell(result) {
    if (!result || !result.ok) return null;
    const rows = PowerShellJson.parseRows(result.stdout);
    if (!rows) return null;
    return { available: true, source: 'powershell', volumes: DiskTableParser.fromLogicalDiskRows(rows) };
  }

  static async _sweepDriveLetters() {
    const volumes = [];
    for (let code = 65; code <= 90; code++) {
      const mount = `${String.fromCharCode(code)}:\\`;
      const space = await DiskProbe._statfs(mount);
      if (space && space.totalBytes > 0) {
        volumes.push({ mount, label: null, filesystem: null, driveType: null, ...space });
      }
    }
    return volumes;
  }

  static async _probePosix() {
    const result = await DiagnosticsCommand.run('df', ['-P', '-k']);
    if (!result.ok) return { available: false, reason: result.reason, volumes: [] };
    const volumes = DiskTableParser.parseDf(result.stdout);
    for (const volume of volumes) Object.assign(volume, await DiskProbe._statfs(volume.mount));
    return { available: true, source: 'df', volumes };
  }

  static async _statfs(mount) {
    try {
      const st = await fs.promises.statfs(mount);
      return { totalBytes: Number(st.blocks) * Number(st.bsize), freeBytes: Number(st.bavail) * Number(st.bsize) };
    } catch (_) {
      return null;
    }
  }
}

module.exports = DiskProbe;
