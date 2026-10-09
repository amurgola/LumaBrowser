const fs = require('fs');
const path = require('path');
const { execFile, execFileSync } = require('child_process');
const NvidiaSmiOutputParser = require('./NvidiaSmiOutputParser');

class NvidiaSmi {
  static BARE_NAME = 'nvidia-smi';
  static TIMEOUT_MS = 4000;
  static COUNT_ARGS = ['-L'];
  static GPU_ARGS = ['--query-gpu=name,memory.total,memory.free', '--format=csv,noheader,nounits'];
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

  static setSmiPath(candidate) {
    const trimmed = typeof candidate === 'string' ? candidate.trim() : '';
    NvidiaSmi._resolvedPath = trimmed || null;
  }

  static smiPath() {
    return NvidiaSmi._resolvedPath || NvidiaSmi.BARE_NAME;
  }

  static async findOnDisk() {
    for (const candidate of NvidiaSmi._candidatesForPlatform()) {
      if (await NvidiaSmi._exists(candidate)) return candidate;
    }
    return null;
  }

  static queryGpuCountSync() {
    return NvidiaSmiOutputParser.parseGpuCount(NvidiaSmi._runSync(NvidiaSmi.COUNT_ARGS));
  }

  static queryGpusSync() {
    return NvidiaSmiOutputParser.parseGpuRows(NvidiaSmi._runSync(NvidiaSmi.GPU_ARGS));
  }

  static queryComputeAppsSync() {
    return NvidiaSmiOutputParser.parseComputeApps(NvidiaSmi._runSync(NvidiaSmi.APPS_ARGS));
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

  static _runSync(args) {
    try {
      return execFileSync(NvidiaSmi.smiPath(), args, NvidiaSmi._execOptions()) || '';
    } catch (_) {
      return '';
    }
  }

  static _run(args) {
    return new Promise((resolve) => {
      execFile(NvidiaSmi.smiPath(), args, NvidiaSmi._execOptions(), (err, stdout) => {
        resolve(err ? '' : (stdout || ''));
      });
    });
  }

  static _execOptions() {
    return { timeout: NvidiaSmi.TIMEOUT_MS, encoding: 'utf8' };
  }
}

module.exports = NvidiaSmi;
