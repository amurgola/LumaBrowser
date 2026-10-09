const ShellQuote = require('./ShellQuote');

class FirewallCommands {
  static RULE_NAME = 'LumaBrowser LAN Sharing';
  static MAC_FIREWALL_TOOL = '/usr/libexec/ApplicationFirewall/socketfilterfw';
  static MDNS_UFW_RULE = 'ufw allow 5353/udp';

  static windowsEnsure(exePath, ruleName = FirewallCommands.RULE_NAME) {
    const displayName = ShellQuote.powershell(ruleName);
    const program = ShellQuote.powershell(exePath);
    return `Get-NetFirewallRule -DisplayName ${displayName} -ErrorAction SilentlyContinue | Remove-NetFirewallRule -ErrorAction SilentlyContinue; `
      + `New-NetFirewallRule -DisplayName ${displayName} -Direction Inbound -Action Allow -Program ${program} -Profile Private,Domain -Enabled True | Out-Null`;
  }

  static windowsElevate(innerPs) {
    return 'Start-Process -Verb RunAs -WindowStyle Hidden -Wait -FilePath powershell '
      + `-ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-Command',${ShellQuote.powershell(innerPs)}`;
  }

  static windowsDetect(ruleName = FirewallCommands.RULE_NAME) {
    return `$r = Get-NetFirewallRule -DisplayName ${ShellQuote.powershell(ruleName)} -ErrorAction SilentlyContinue; `
      + '$c = @((Get-NetConnectionProfile -ErrorAction SilentlyContinue).NetworkCategory); '
      + '[pscustomobject]@{ rule = [bool]$r; categories = $c } | ConvertTo-Json -Compress';
  }

  static macAllow(appPath) {
    const tool = FirewallCommands.MAC_FIREWALL_TOOL;
    const app = ShellQuote.posix(appPath);
    return `${tool} --add ${app}; ${tool} --unblockapp ${app}`;
  }

  static linuxUfw(ports) {
    const lines = (ports || [])
      .filter((port) => Number.isInteger(port) && port > 0)
      .map((port) => `ufw allow ${port}/tcp`);
    lines.push(FirewallCommands.MDNS_UFW_RULE);
    return lines.join('; ');
  }
}

module.exports = FirewallCommands;
