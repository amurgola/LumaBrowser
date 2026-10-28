const fs = require('fs');

class LinuxDistro {
  static OS_RELEASE = '/etc/os-release';
  static MANAGERS = Object.freeze({
    pacman: ['arch', 'archlinux', 'cachyos', 'manjaro', 'endeavouros', 'garuda', 'artix'],
    apt: ['debian', 'ubuntu', 'linuxmint', 'pop', 'elementary', 'neon', 'zorin', 'kali', 'raspbian'],
    dnf: ['fedora', 'rhel', 'centos', 'rocky', 'almalinux', 'nobara'],
  });

  static probe({ platform = process.platform, fsLike = fs } = {}) {
    if (platform !== 'linux') return { linux: false, id: null, idLike: [], name: null, packageManager: null };
    const fields = LinuxDistro.parse(LinuxDistro._read(fsLike));
    const id = String(fields.ID || '').toLowerCase() || null;
    const idLike = String(fields.ID_LIKE || '').toLowerCase().split(/\s+/).filter(Boolean);
    return {
      linux: true,
      id,
      idLike,
      name: fields.PRETTY_NAME || fields.NAME || id,
      packageManager: LinuxDistro.managerFor(id, idLike),
    };
  }

  static parse(text) {
    const fields = {};
    for (const raw of String(text || '').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      fields[line.slice(0, eq).trim()] = LinuxDistro._unquote(line.slice(eq + 1).trim());
    }
    return fields;
  }

  static managerFor(id, idLike = []) {
    for (const candidate of [id, ...(idLike || [])]) {
      if (!candidate) continue;
      for (const [manager, ids] of Object.entries(LinuxDistro.MANAGERS)) {
        if (ids.includes(candidate)) return manager;
      }
    }
    return null;
  }

  static _unquote(value) {
    const match = /^(["'])(.*)\1$/.exec(value);
    return match ? match[2] : value;
  }

  static _read(fsLike) {
    try {
      return String(fsLike.readFileSync(LinuxDistro.OS_RELEASE, 'utf8'));
    } catch (_) {
      return '';
    }
  }
}

module.exports = LinuxDistro;
