const path = require('path');

class DiskTableParser {
  static DRIVE_TYPES = {
    0: 'unknown',
    1: 'no-root',
    2: 'removable',
    3: 'fixed',
    4: 'network',
    5: 'cd-rom',
    6: 'ram-disk',
  };

  static PSEUDO_FILESYSTEMS = /^(proc|sysfs|devtmpfs|tmpfs|cgroup|squashfs|overlay)$/i;

  static fromLogicalDiskRows(rows) {
    return rows.map((row) => ({
      mount: row.DeviceID || null,
      label: row.VolumeName || null,
      filesystem: row.FileSystem || null,
      driveType: DiskTableParser.driveTypeName(row.DriveType),
      totalBytes: Number(row.Size) || 0,
      freeBytes: Number(row.FreeSpace) || 0,
    }));
  }

  static parseWmicCsv(text) {
    const lines = (text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const header = lines[0].split(',').map((h) => h.trim());
    const column = (cols, name) => cols[header.indexOf(name)];
    const volumes = [];
    for (const line of lines.slice(1)) {
      const cols = line.split(',');
      const size = Number(column(cols, 'Size'));
      if (!Number.isFinite(size) || size <= 0) continue;
      volumes.push({
        mount: column(cols, 'Caption') || null,
        label: column(cols, 'VolumeName') || null,
        filesystem: column(cols, 'FileSystem') || null,
        driveType: DiskTableParser.driveTypeName(Number(column(cols, 'DriveType'))),
        totalBytes: size,
        freeBytes: Number(column(cols, 'FreeSpace')) || 0,
      });
    }
    return volumes;
  }

  static parseDf(text) {
    const volumes = [];
    for (const line of (text || '').split(/\r?\n/).slice(1).filter(Boolean)) {
      const parts = line.split(/\s+/);
      if (parts.length < 6) continue;
      const filesystem = parts[0];
      const totalKB = Number(parts[1]) || 0;
      if (totalKB === 0 || DiskTableParser.PSEUDO_FILESYSTEMS.test(filesystem)) continue;
      const mount = parts.slice(5).join(' ');
      volumes.push({
        mount,
        label: path.basename(mount) || mount,
        filesystem,
        driveType: null,
        totalBytes: totalKB * 1024,
        freeBytes: (Number(parts[3]) || 0) * 1024,
      });
    }
    return volumes;
  }

  static driveTypeName(code) {
    if (code == null) return null;
    return DiskTableParser.DRIVE_TYPES[code] || `type-${code}`;
  }
}

module.exports = DiskTableParser;
