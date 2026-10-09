const ShellWords = require('../ShellWords');

class HostPathCatalog {
  static ITSELF = 'itself';
  static ENTRIES = 'entries';
  static TREE = 'tree';

  static POSIX = Object.freeze([
    HostPathCatalog._group('the boot loader and kernels', HostPathCatalog.ENTRIES, ['/boot', '/efi']),
    HostPathCatalog._group('system programs and libraries', HostPathCatalog.ENTRIES, ['/bin', '/sbin', '/lib', '/lib32', '/lib64', '/libx32', '/opt', '/usr']),
    HostPathCatalog._group('system-wide configuration', HostPathCatalog.ENTRIES, ['/etc']),
    HostPathCatalog._group('live system state', HostPathCatalog.ENTRIES, ['/run', '/srv', '/var']),
    HostPathCatalog._group('kernel and device interfaces', HostPathCatalog.ENTRIES, ['/dev', '/proc', '/sys']),
    HostPathCatalog._group("the administrator's home", HostPathCatalog.ENTRIES, ['/root']),
    HostPathCatalog._group("every user's home directory", HostPathCatalog.ITSELF, ['/home', '/Users']),
    HostPathCatalog._group('mounted drives', HostPathCatalog.ITSELF, ['/media', '/mnt', '/Volumes']),
    HostPathCatalog._group('the macOS system domain', HostPathCatalog.TREE, ['/System']),
    HostPathCatalog._group('macOS shared resources', HostPathCatalog.ENTRIES, ['/Applications', '/Library', '/private']),
  ].flat());

  static WINDOWS = Object.freeze([
    HostPathCatalog._group('the Windows installation', HostPathCatalog.TREE, ['Windows']),
    HostPathCatalog._group('installed programs', HostPathCatalog.ITSELF, ['Program Files', 'Program Files (x86)']),
    HostPathCatalog._group('machine-wide application data', HostPathCatalog.ITSELF, ['ProgramData']),
    HostPathCatalog._group('every user profile', HostPathCatalog.ITSELF, ['Users']),
    HostPathCatalog._group('boot and recovery files', HostPathCatalog.ITSELF, ['Boot', 'bootmgr', 'EFI', 'Recovery']),
    HostPathCatalog._group('restore points and the recycle bin', HostPathCatalog.ITSELF, ['$Recycle.Bin', 'System Volume Information']),
    HostPathCatalog._group('paging and hibernation files', HostPathCatalog.ITSELF, ['hiberfil.sys', 'pagefile.sys', 'swapfile.sys']),
  ].flat());

  static locate(canonical) {
    const path = ShellWords.lower(canonical);
    return HostPathCatalog._locateWindows(path) || HostPathCatalog._locatePosix(path);
  }

  static _group(role, scope, locations) {
    return locations.map((location) => Object.freeze({ location, role, scope }));
  }

  static _locatePosix(path) {
    if (!path.startsWith('/')) return null;
    return HostPathCatalog._firstCovering(HostPathCatalog.POSIX, path, (entry) => entry.location);
  }

  static _locateWindows(path) {
    const drive = /^([a-z]):\/(.+)$/.exec(path);
    if (!drive) return null;
    const label = (entry) => `${drive[1].toUpperCase()}:/${entry.location}`;
    return HostPathCatalog._firstCovering(HostPathCatalog.WINDOWS, drive[2], (entry) => entry.location, label);
  }

  static _firstCovering(entries, path, keyOf, labelOf = keyOf) {
    for (const entry of entries) {
      const relation = HostPathCatalog._relation(path, ShellWords.lower(keyOf(entry)), entry.scope);
      if (relation) return { location: labelOf(entry), role: entry.role, relation };
    }
    return null;
  }

  static _relation(path, key, scope) {
    if (path === key) return 'is';
    if (scope === HostPathCatalog.ITSELF || !path.startsWith(`${key}/`)) return null;
    const below = path.slice(key.length + 1);
    return scope === HostPathCatalog.TREE || !below.includes('/') ? 'inside' : null;
  }
}

module.exports = HostPathCatalog;
