const HostCapability = require('./HostCapability');

class FirewallControl extends HostCapability {
  static CUTS_NETWORK = 'Firewall changes can cut the machine off the network.';

  static XTABLES = new Set(['arptables', 'ebtables', 'ip6tables-legacy', 'ip6tables-nft', 'ip6tables', 'iptables-legacy', 'iptables-nft', 'iptables']);
  static XTABLES_RESTORE = new Set(['iptables-restore', 'ip6tables-restore', 'iptables-legacy-restore', 'iptables-nft-restore']);
  static XTABLES_WRITE_LETTERS = /^-(?!-)[A-Za-z]*[ADIRFXPNEZ]/;
  static XTABLES_WRITE_WORDS = new Set(['--append', '--delete', '--insert', '--replace', '--flush', '--delete-chain', '--policy', '--new-chain', '--rename-chain', '--zero']);
  static NFT_WRITES = new Set(['add', 'create', 'insert', 'replace', 'delete', 'destroy', 'flush', 'reset', 'rename', 'import']);
  static UFW_READS = new Set(['status', 'show', 'version', 'help', 'app']);
  static FIREWALLD_WRITE_PREFIXES = ['--add-', '--remove-', '--set-', '--new-', '--delete-', '--change-', '--load-', '--reset-', '--panic-', '--lockdown-', '--direct', '--passthrough', '--policy-'];
  static FIREWALLD_WRITE_WORDS = new Set(['--reload', '--complete-reload', '--runtime-to-permanent']);
  static PF_WRITE_LETTERS = new Set(['d', 'e', 'f', 'F', 'k', 'K', 'T']);
  static PF_VALUE_LETTERS = new Set(['a', 'D', 'f', 'k', 'K', 'L', 'o', 'p', 's', 't', 'T', 'x']);
  static NETSH_READS = new Set(['show', 'dump', 'export', 'help', '?']);

  static CHANGES = Object.freeze({
    xtables: FirewallControl._xtablesChanges,
    xtablesRestore: (command) => !command.has('-t', '--test'),
    nft: (command) => !command.has('-c', '--check') && (command.has('-f', '--file', '-i', '--interactive') || FirewallControl.NFT_WRITES.has(command.positionals[0])),
    ufw: (command) => !command.has('--dry-run') && command.positionals.length > 0 && !FirewallControl.UFW_READS.has(command.positionals[0]),
    firewalld: FirewallControl._firewalldChanges,
    pfctl: FirewallControl._pfctlChanges,
    netsh: (command) => !command.positionals.slice(1, 3).some((word) => FirewallControl.NETSH_READS.has(word)),
    cmdlet: (command) => !command.name.startsWith('get-'),
  });

  covers(command) {
    return this._toolOf(command) !== null;
  }

  judge(command) {
    return FirewallControl.CHANGES[this._toolOf(command)](command) ? HostCapability.forbid(FirewallControl.CUTS_NETWORK) : null;
  }

  _toolOf(command) {
    const { name } = command;
    if (FirewallControl.XTABLES.has(name)) return 'xtables';
    if (FirewallControl.XTABLES_RESTORE.has(name)) return 'xtablesRestore';
    if (name === 'nft' || name === 'ufw' || name === 'pfctl') return name;
    if (name === 'firewall-cmd' || name === 'firewall-offline-cmd') return 'firewalld';
    if (name === 'netsh' && ['advfirewall', 'firewall'].includes(command.positionals[0])) return 'netsh';
    if (/^[a-z]+-netfirewall/.test(name)) return 'cmdlet';
    return null;
  }

  static _xtablesChanges(command) {
    return command.args.some((arg) => FirewallControl.XTABLES_WRITE_LETTERS.test(arg))
      || command.has(...FirewallControl.XTABLES_WRITE_WORDS);
  }

  static _firewalldChanges(command) {
    return command.has(...FirewallControl.FIREWALLD_WRITE_WORDS)
      || command.hasPrefix(...FirewallControl.FIREWALLD_WRITE_PREFIXES);
  }

  static _pfctlChanges(command) {
    const letters = command.args.filter((arg) => /^-[A-Za-z]/.test(arg)).flatMap(FirewallControl._pfLettersBeforeValue);
    return !letters.includes('n') && letters.some((letter) => FirewallControl.PF_WRITE_LETTERS.has(letter));
  }

  static _pfLettersBeforeValue(flag) {
    const letters = [];
    for (const letter of flag.slice(1)) {
      letters.push(letter);
      if (FirewallControl.PF_VALUE_LETTERS.has(letter)) break;
    }
    return letters;
  }
}

module.exports = FirewallControl;
