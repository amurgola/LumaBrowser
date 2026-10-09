const PowerShellRunner = require('./PowerShellRunner');
const PowerShellJson = require('./PowerShellJson');

class PnpDisplayDevices {
  static NON_GPU = /microsoft basic|basic render|basic display|remote desktop|hyper-?v|citrix|parsec|virtual display|idd|spacedesk/i;

  static SCRIPT =
    'Get-PnpDevice -Class Display -ErrorAction SilentlyContinue | '
    + 'Select-Object FriendlyName, InstanceId, Manufacturer, '
    + "@{Name='Status';Expression={[string]$_.Status}}, "
    + "@{Name='Present';Expression={[bool]$_.Present}} | "
    + 'ConvertTo-Json -Compress -Depth 3';

  static async list() {
    const result = await PowerShellRunner.run(PnpDisplayDevices.SCRIPT);
    if (!result || !result.ok) return null;
    return PowerShellJson.parseRows(result.stdout);
  }

  static isNonGpu(name) {
    return PnpDisplayDevices.NON_GPU.test(name || '');
  }
}

module.exports = PnpDisplayDevices;
