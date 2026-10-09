const ShellWords = require('../../ShellWords');

class CriticalServices {
  static GROUPS = Object.freeze([
    {
      consequence: 'provides remote access; stopping it can lock you out of the machine',
      names: ['lanmanserver', 'openssh', 'remote desktop services', 'screensharing', 'ssh', 'sshd', 'tailscaled', 'termservice', 'windows remote management (ws-management)', 'winrm'],
    },
    {
      consequence: 'runs networking; stopping it can cut the machine off the network',
      names: ['configd', 'dhcp', 'dhcpcd', 'dnscache', 'mdnsresponder', 'netprofm', 'network', 'networking', 'networkmanager', 'nsi', 'systemd-networkd', 'systemd-resolved', 'wlansvc', 'wpa_supplicant'],
    },
    {
      consequence: 'keeps the login session alive; stopping it can end the session',
      names: ['dbus-broker', 'dbus', 'display-manager', 'eventlog', 'gdm', 'gdm3', 'lightdm', 'loginwindow', 'polkit', 'rpcss', 'sddm', 'systemd-logind', 'windowserver'],
    },
    {
      consequence: "guards the machine; stopping it drops the machine's defenses",
      names: ['apparmor', 'auditd', 'firewalld', 'mpssvc', 'ufw', 'windefend', 'windows defender firewall', 'windows update', 'wscsvc', 'wuauserv'],
    },
  ]);

  static CONSEQUENCES = new Map(CriticalServices.GROUPS.flatMap((group) => group.names.map((name) => [name, group.consequence])));

  static canonical(rawName) {
    let name = ShellWords.lower(rawName).trim();
    name = name.replace(/^(system|gui\/\d+|user\/\d+|login\/\d+|pid\/\d+)\//, '');
    if (!name.includes(' ')) name = name.split('/').pop();
    name = name.replace(/\.(service|socket|plist)$/, '').replace(/@.*$/, '');
    return /^[a-z0-9-]+(\.[a-z0-9_-]+){2,}$/.test(name) ? name.split('.').pop() : name;
  }

  static consequenceOf(rawName) {
    return CriticalServices.CONSEQUENCES.get(CriticalServices.canonical(rawName)) || null;
  }
}

module.exports = CriticalServices;
