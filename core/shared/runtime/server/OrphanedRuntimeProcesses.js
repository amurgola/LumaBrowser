const path = require('path');
const ProcessDescendants = require('./ProcessDescendants');

class OrphanedRuntimeProcesses {
  static async find(binaryPath, { platform = process.platform, readProcesses = ProcessDescendants.readWindowsProcesses } = {}) {
    const folder = OrphanedRuntimeProcesses.runtimeFolder(binaryPath);
    if (platform !== 'win32' || !folder) return [];
    try {
      return OrphanedRuntimeProcesses.orphansIn(await readProcesses(), folder);
    } catch (_) {
      return [];
    }
  }

  static orphansIn(rows, folder) {
    const list = Array.isArray(rows) ? rows : [];
    const alive = new Set(list.map((row) => Number(row && row.ProcessId)));
    const needle = folder.toLowerCase();
    return list
      .filter((row) => OrphanedRuntimeProcesses._fromFolder(row, needle))
      .filter((row) => !alive.has(Number(row.ParentProcessId)))
      .map((row) => ({ pid: Number(row.ProcessId), name: String(row.Name || '') }))
      .filter((row) => Number.isInteger(row.pid) && row.name);
  }

  static runtimeFolder(binaryPath) {
    if (typeof binaryPath !== 'string' || !binaryPath) return null;
    const dir = path.dirname(binaryPath);
    return path.basename(dir).toLowerCase() === 'bin' ? path.dirname(dir) : dir;
  }

  static async sweep(binaryPath, { find = OrphanedRuntimeProcesses.find, killAll = ProcessDescendants.killAll } = {}) {
    const orphans = await find(binaryPath);
    if (orphans.length) killAll(orphans);
    return orphans;
  }

  static _fromFolder(row, needle) {
    const exe = String((row && row.ExecutablePath) || '').toLowerCase();
    const command = String((row && row.CommandLine) || '').toLowerCase();
    return exe.startsWith(needle) || command.includes(needle);
  }
}

module.exports = OrphanedRuntimeProcesses;
