const PowerShellRunner = require('./PowerShellRunner');
const PowerShellJson = require('./PowerShellJson');

class RegistryVramProbe {
  static SCRIPT = `
    $items = Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\*' -ErrorAction SilentlyContinue
    $items |
      Where-Object { $_.'HardwareInformation.qwMemorySize' -gt 0 -or $_.'HardwareInformation.MemorySize' -gt 0 } |
      Select-Object DriverDesc, ProviderName,
        @{Name='MemBytes';Expression={
          if ($_.'HardwareInformation.qwMemorySize') { [int64]$_.'HardwareInformation.qwMemorySize' }
          elseif ($_.'HardwareInformation.MemorySize') { [int64]$_.'HardwareInformation.MemorySize' }
          else { 0 }
        }} |
      ConvertTo-Json -Compress -Depth 3
  `;

  static async probe() {
    const result = await PowerShellRunner.run(RegistryVramProbe.SCRIPT);
    if (!result || !result.ok) return null;
    return PowerShellJson.parseRows(result.stdout);
  }
}

module.exports = RegistryVramProbe;
