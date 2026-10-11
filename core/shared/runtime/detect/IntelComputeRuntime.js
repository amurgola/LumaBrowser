const fs = require('fs');
const path = require('path');

class IntelComputeRuntime {
  static ICD_DIR = '/etc/OpenCL/vendors';
  static ACCEL_DIR = '/dev/accel';
  static LIB_DIRS = [
    '/usr/lib/x86_64-linux-gnu', '/usr/lib', '/usr/lib64', '/usr/local/lib', '/lib/x86_64-linux-gnu', '/lib', '/lib64',
    '/usr/lib/x86_64-linux-gnu/intel-npu', '/usr/lib/intel-npu',
  ];
  static LEVEL_ZERO_GPU = ['libze_intel_gpu.so.1', 'libze_intel_gpu.so'];
  static LEVEL_ZERO_LOADER = ['libze_loader.so.1', 'libze_loader.so'];
  static NPU_DRIVER = ['libze_intel_npu.so.1', 'libze_intel_npu.so', 'libze_intel_vpu.so.1', 'libze_intel_vpu.so'];

  static PACKAGES = {
    openclIcd: 'intel-opencl-icd (Ubuntu, from the Intel graphics repository) or intel-compute-runtime (Arch)',
    levelZeroGpu: 'libze-intel-gpu1 or intel-level-zero-gpu (Ubuntu) or intel-compute-runtime (Arch)',
    levelZeroLoader: 'libze1 (Ubuntu) or level-zero-loader (Arch)',
    npuDriver: 'intel-level-zero-npu, intel-driver-compiler-npu and intel-fw-npu from intel/linux-npu-driver (1.28 or newer for Panther Lake)',
  };

  static probe({ platform = process.platform, fsLike = fs, libDirs = IntelComputeRuntime.LIB_DIRS } = {}) {
    if (platform !== 'linux') return { linux: false, openclIcd: null, levelZeroGpu: null, levelZeroLoader: null, npuDriver: null, accelNode: null };
    return {
      linux: true,
      openclIcd: IntelComputeRuntime._intelIcd(fsLike),
      levelZeroGpu: IntelComputeRuntime._anyLib(fsLike, libDirs, IntelComputeRuntime.LEVEL_ZERO_GPU),
      levelZeroLoader: IntelComputeRuntime._anyLib(fsLike, libDirs, IntelComputeRuntime.LEVEL_ZERO_LOADER),
      npuDriver: IntelComputeRuntime._anyLib(fsLike, libDirs, IntelComputeRuntime.NPU_DRIVER),
      accelNode: IntelComputeRuntime._accelNode(fsLike),
    };
  }

  static _intelIcd(fsLike) {
    try {
      return fsLike.readdirSync(IntelComputeRuntime.ICD_DIR).some((name) => /intel/i.test(name) && /\.icd$/i.test(name));
    } catch (_) {
      return false;
    }
  }

  static _anyLib(fsLike, libDirs, names) {
    for (const dir of libDirs) {
      for (const name of names) {
        try {
          if (fsLike.existsSync(path.posix.join(dir, name))) return true;
        } catch (_) {}
      }
    }
    return false;
  }

  static _accelNode(fsLike) {
    try {
      return fsLike.readdirSync(IntelComputeRuntime.ACCEL_DIR).some((name) => /^accel\d+$/.test(name));
    } catch (_) {
      return false;
    }
  }
}

module.exports = IntelComputeRuntime;
