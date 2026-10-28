class IntelDriverPlan {
  static PIECES = Object.freeze([
    {
      key: 'gpuCompute',
      label: 'Intel GPU compute runtime (OpenCL ICD and Level Zero GPU driver)',
      why: 'Lets the OpenVINO build run on the Intel GPU and the SYCL build find it. The Vulkan build works without it.',
    },
    {
      key: 'levelZeroLoader',
      label: 'Level Zero loader',
      why: 'The loader the SYCL build and the OpenVINO NPU plugin open the Intel drivers through.',
    },
    {
      key: 'npuDriver',
      label: 'Intel NPU user-space driver',
      why: 'Lets the OpenVINO build run models on the NPU (device NPU in Defaults). The kernel driver alone is not enough.',
    },
  ]);

  static PACKAGES = Object.freeze({
    gpuCompute: { pacman: ['intel-compute-runtime'], apt: ['intel-opencl-icd', 'libze-intel-gpu1'] },
    levelZeroLoader: { pacman: ['level-zero-loader'], apt: ['libze1'] },
    npuDriver: { pacman: ['intel-npu-driver'] },
  });

  static MANUAL = Object.freeze({
    gpuCompute: "Install Intel's compute runtime by hand: intel-compute-runtime (Arch) or intel-opencl-icd and libze-intel-gpu1 (Ubuntu, from the Intel graphics repository). Panther Lake needs 26.18 or newer.",
    levelZeroLoader: 'Install the Level Zero loader by hand: level-zero-loader (Arch) or libze1 (Ubuntu).',
    npuDriver: 'Install intel-level-zero-npu, intel-driver-compiler-npu and intel-fw-npu from the intel/linux-npu-driver GitHub releases (1.28 or newer for Panther Lake).',
  });

  static COMMANDS = Object.freeze({
    pacman: (packages) => `sudo pacman -S --needed --noconfirm ${packages.join(' ')}`,
    apt: (packages) => `sudo apt-get update && sudo apt-get install -y ${packages.join(' ')}`,
  });

  static NO_MANAGER_NOTE = 'No supported package manager (pacman or apt) was recognised on this host, so nothing can be installed automatically.';
  static RENDER_GROUP_NOTE = 'Your user is not in the render group. If /dev/accel or /dev/dri/renderD* turns group-only after the driver install, run "sudo usermod -aG render $USER" and log in again.';

  static build({ intel, distro, hasIntelGpu = false, hasIntelNpu = false, renderGroupMember = null } = {}) {
    const base = { applicable: false, reason: null, pieces: [], packages: [], manager: null, distro: null, command: null, notes: [] };
    if (!intel || !intel.linux || !distro || !distro.linux) return { ...base, reason: 'Driver installs are only automated on Linux.' };
    base.distro = distro.name || distro.id || null;
    base.manager = distro.packageManager || null;
    if (!hasIntelGpu && !hasIntelNpu) return { ...base, reason: 'No Intel GPU or NPU detected.' };
    const pieces = IntelDriverPlan._missingPieces({ intel, hasIntelGpu, hasIntelNpu, manager: base.manager });
    if (pieces.length === 0) return { ...base, reason: 'Every Intel compute piece is installed.' };
    const packages = pieces.flatMap((p) => p.packages || []);
    const command = base.manager && packages.length > 0 && IntelDriverPlan.COMMANDS[base.manager]
      ? IntelDriverPlan.COMMANDS[base.manager](packages)
      : null;
    return {
      ...base,
      applicable: true,
      pieces,
      packages,
      command,
      notes: IntelDriverPlan._notes({ pieces, manager: base.manager, hasIntelNpu, renderGroupMember }),
    };
  }

  static _missingPieces({ intel, hasIntelGpu, hasIntelNpu, manager }) {
    const missing = {
      gpuCompute: hasIntelGpu && (intel.openclIcd === false || intel.levelZeroGpu === false),
      levelZeroLoader: (hasIntelGpu || hasIntelNpu) && intel.levelZeroLoader === false,
      npuDriver: hasIntelNpu && intel.npuDriver === false,
    };
    return IntelDriverPlan.PIECES.filter((p) => missing[p.key]).map((p) => IntelDriverPlan._piece(p, manager));
  }

  static _piece(piece, manager) {
    const packages = (manager && IntelDriverPlan.PACKAGES[piece.key][manager]) || null;
    return {
      key: piece.key,
      label: piece.label,
      why: piece.why,
      packages: packages ? [...packages] : null,
      manual: packages ? null : IntelDriverPlan.MANUAL[piece.key],
    };
  }

  static _notes({ pieces, manager, hasIntelNpu, renderGroupMember }) {
    const notes = [];
    if (!manager) notes.push(IntelDriverPlan.NO_MANAGER_NOTE);
    for (const piece of pieces) if (piece.manual) notes.push(piece.manual);
    if (hasIntelNpu && renderGroupMember === false) notes.push(IntelDriverPlan.RENDER_GROUP_NOTE);
    return notes;
  }
}

module.exports = IntelDriverPlan;
