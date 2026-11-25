const PowerShellRunner = require('../../../llm-server/diagnostics/PowerShellRunner');
const PowerShellJson = require('../../../llm-server/diagnostics/PowerShellJson');
const ChildProcessRegistry = require('../../../shell/ChildProcessRegistry');

class ProcessDescendants {
  static SCRIPT = 'Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name, ExecutablePath, CommandLine | ConvertTo-Json -Compress';
  static TIMEOUT_MS = 15000;

  static async list(rootPid, { platform = process.platform, readProcesses = ProcessDescendants.readWindowsProcesses } = {}) {
    if (platform !== 'win32' || !Number.isInteger(rootPid)) return [];
    try {
      return ProcessDescendants.descendantsOf(await readProcesses(), rootPid);
    } catch (_) {
      return [];
    }
  }

  static descendantsOf(rows, rootPid) {
    const childrenOf = new Map();
    for (const row of Array.isArray(rows) ? rows : []) {
      const pid = Number(row && row.ProcessId);
      const parent = Number(row && row.ParentProcessId);
      if (!Number.isInteger(pid) || !Number.isInteger(parent) || pid === parent) continue;
      if (!childrenOf.has(parent)) childrenOf.set(parent, []);
      childrenOf.get(parent).push({ pid, name: String(row.Name || '') });
    }
    const found = [];
    const seen = new Set([rootPid]);
    const queue = [rootPid];
    while (queue.length) {
      for (const child of childrenOf.get(queue.shift()) || []) {
        if (seen.has(child.pid) || !child.name) continue;
        seen.add(child.pid);
        found.push(child);
        queue.push(child.pid);
      }
    }
    return found;
  }

  static killAll(descendants, { platform = process.platform, killNamed = ChildProcessRegistry.killTreeNamed } = {}) {
    if (platform !== 'win32') return;
    for (const { pid, name } of descendants || []) {
      try { killNamed(pid, name); } catch (_) {}
    }
  }

  static async readWindowsProcesses() {
    const result = await PowerShellRunner.run(ProcessDescendants.SCRIPT, ProcessDescendants.TIMEOUT_MS);
    if (!result || !result.ok) return [];
    return PowerShellJson.parseRows(result.stdout) || [];
  }
}

module.exports = ProcessDescendants;
