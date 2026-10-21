const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const NvidiaSmiOutputParser = require('./NvidiaSmiOutputParser');
const NvidiaSmiOutcome = require('./nvidia-smi/NvidiaSmiOutcome');

class NvidiaSmi {
  static BARE_NAME = 'nvidia-smi';
  static TIMEOUT_MS = 4000;
  static COUNT_ARGS = ['-L'];
  static GPU_ARGS = ['--query-gpu=index,pci.bus_id,name,memory.total,memory.free', '--format=csv,noheader,nounits'];
  static APPS_ARGS = ['--query-compute-apps=pid,used_memory', '--format=csv,noheader,nounits'];

  static CANDIDATES_WIN = [
    path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'nvidia-smi.exe'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'NVIDIA Corporation', 'NVSMI', 'nvidia-smi.exe'),
    process.env.ProgramW6432
      ? path.join(process.env.ProgramW6432, 'NVIDIA Corporation', 'NVSMI', 'nvidia-smi.exe')
      : null,
    process.env.CUDA_PATH ? path.join(process.env.CUDA_PATH, 'bin', 'nvidia-smi.exe') : null,
  ].filter(Boolean);

  static CANDIDATES_POSIX = [
    '/usr/bin/nvidia-smi',
    '/usr/local/bin/nvidia-smi',
    '/usr/local/cuda/bin/nvidia-smi',
    '/opt/cuda/bin/nvidia-smi',
  ];

  static _resolvedPath = null;
  static _pathListeners = new Set();

  static setSmiPath(candidate) {
    const trimmed = typeof candidate === 'string' ? candidate.trim() : '';
    const next = trimmed || null;
    if (next === NvidiaSmi._resolvedPath) return;
    NvidiaSmi._resolvedPath = next;
    for (const listener of [...NvidiaSmi._pathListeners]) {
      try { listener(NvidiaSmi.smiPath()); } catch (_) {}
    }
  }

  static smiPath() {
    return NvidiaSmi._resolvedPath || NvidiaSmi.BARE_NAME;
  }

  static hasExplicitPath() {
    return NvidiaSmi._resolvedPath !== null;
  }

  static onPathChange(listener) {
    if (typeof listener !== 'function') return () => {};
    NvidiaSmi._pathListeners.add(listener);
    return () => { NvidiaSmi._pathListeners.delete(listener); };
  }

  static async findOnDisk() {
    for (const candidate of NvidiaSmi._candidatesForPlatform()) {
      if (await NvidiaSmi._exists(candidate)) return candidate;
    }
    return null;
  }

  static streamArgs(intervalMs) {
    return [...NvidiaSmi.GPU_ARGS, '-lms', String(Math.max(100, Math.floor(Number(intervalMs) || 0)))];
  }

  static spawnOptions() {
    return { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] };
  }

  static async queryGpuCount() {
    return NvidiaSmiOutputParser.parseGpuCount(await NvidiaSmi._run(NvidiaSmi.COUNT_ARGS));
  }

  static async queryGpus() {
    return NvidiaSmiOutputParser.parseGpuRows(await NvidiaSmi._run(NvidiaSmi.GPU_ARGS));
  }

  static async queryComputeApps() {
    return NvidiaSmiOutputParser.parseComputeApps(await NvidiaSmi._run(NvidiaSmi.APPS_ARGS));
  }

  static query(args, { timeoutMs = NvidiaSmi.TIMEOUT_MS, now = () => Date.now() } = {}) {
    return new Promise((resolve) => {
      let settled = false;
      const settle = (value) => { if (!settled) { settled = true; resolve(value); } };
      let child = null;
      try {
        child = execFile(NvidiaSmi.smiPath(), args, NvidiaSmi._execOptions(timeoutMs), (err, stdout, stderr) => {
          settle({
            ok: !err,
            stdout: stdout || '',
            stderr: stderr || '',
            outcome: err ? NvidiaSmiOutcome.fromError(err, now()) : NvidiaSmiOutcome.ok(now()),
          });
        });
      } catch (err) {
        settle({ ok: false, stdout: '', stderr: '', outcome: NvidiaSmiOutcome.fromError(err, now()) });
        return;
      }
      if (child && typeof child.on === 'function') {
        child.on('error', (err) => settle({ ok: false, stdout: '', stderr: '', outcome: NvidiaSmiOutcome.fromError(err, now()) }));
      }
    });
  }

  static _candidatesForPlatform() {
    return process.platform === 'win32' ? NvidiaSmi.CANDIDATES_WIN : NvidiaSmi.CANDIDATES_POSIX;
  }

  static async _exists(candidate) {
    try {
      await fs.promises.access(candidate, fs.constants.F_OK);
      return true;
    } catch (_) {
      return false;
    }
  }

  static async _run(args) {
    const result = await NvidiaSmi.query(args);
    return result.ok ? result.stdout : '';
  }

  static _execOptions(timeoutMs) {
    return { timeout: timeoutMs, encoding: 'utf8', windowsHide: true };
  }
}

module.exports = NvidiaSmi;
