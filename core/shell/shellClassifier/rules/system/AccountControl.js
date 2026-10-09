const HostCapability = require('./HostCapability');

class AccountControl extends HostCapability {
  static ALWAYS_CHANGES = new Set([
    'useradd', 'adduser', 'userdel', 'deluser', 'usermod', 'groupadd', 'addgroup', 'groupdel', 'delgroup', 'groupmod',
    'gpasswd', 'chpasswd', 'chsh', 'chfn', 'vipw', 'vigr', 'sysadminctl',
  ]);
  static LOCAL_ACCOUNT_CMDLET = /^(new|remove|set|rename|disable|enable|add)-local(user|group|groupmember)$/;
  static DSCL_WRITES = ['-create', '-delete', '-append', '-merge', '-passwd', '-change', '-changei'];

  static CHANGES = Object.freeze({
    passwd: (command) => !command.has('-s', '--status'),
    chage: (command) => !command.has('-l', '--list'),
    visudo: (command) => !command.has('-c', '--check'),
    dscl: (command) => command.has(...AccountControl.DSCL_WRITES),
    net: AccountControl._netChanges,
  });

  covers(command) {
    if (command.name === 'net') return ['user', 'localgroup', 'group', 'accounts', 'share'].includes(command.positionals[0]);
    return AccountControl.ALWAYS_CHANGES.has(command.name)
      || AccountControl.LOCAL_ACCOUNT_CMDLET.test(command.name)
      || Object.hasOwn(AccountControl.CHANGES, command.name);
  }

  judge(command) {
    return this._changes(command) ? HostCapability.ask(`${command.display} changes user accounts or shares.`) : null;
  }

  _changes(command) {
    if (AccountControl.ALWAYS_CHANGES.has(command.name) || AccountControl.LOCAL_ACCOUNT_CMDLET.test(command.name)) return true;
    return AccountControl.CHANGES[command.name](command);
  }

  static _netChanges(command) {
    const [area] = command.positionals;
    if (area === 'share') return command.hasPrefix('/delete');
    if (area === 'accounts') return command.lowered.some((arg) => arg.startsWith('/'));
    return command.positionals.length > 2 || command.hasPrefix('/add', '/delete', '/active', '/passwordreq', '/expires');
  }
}

module.exports = AccountControl;
