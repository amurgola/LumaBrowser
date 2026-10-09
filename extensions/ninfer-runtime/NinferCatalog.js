class NinferCatalog {
  static GiB = 1024 * 1024 * 1024;
  static RUNTIME_ID = 'ninfer';

  static PREBUILT = {
    url: process.env.LUMA_NINFER_PREBUILT || null,
    sha256: null,
    version: 'feaf4dd0',
    asset: 'ninfer-linux-x64-cuda131.tar.gz',
  };

  static SOURCE = {
    repo: 'https://github.com/Neroued/ninfer.git',
    commit: 'feaf4dd0',
  };

  static KV_BYTES_PER_TOKEN = Math.ceil((8.98 * NinferCatalog.GiB) / 139264);
  static WORKSPACE_BYTES = Math.round(2.5 * NinferCatalog.GiB);

  static RUNTIME_ENTRY = {
    id: NinferCatalog.RUNTIME_ID,
    name: 'NInfer (RTX 5090)',
    kind: 'inference',
    acquisition: 'extension',
    description:
      'From-scratch C++/CUDA server for the Qwen NInfer artifacts, compiled for '
      + 'the RTX 5090 only (sm_120a). Single GPU, OpenAI-compatible API, '
      + 'built-in MTP speculative decoding. Runs inside WSL2 on Windows and '
      + 'natively on Linux. Loads only its own .ninfer model files: see the '
      + 'add-on models in the Models card.',
    platforms: ['win32', 'linux'],
    requiresHw: {
      kind: 'nvidia-cuda',
      cudaMajor: 13,
      gpuNameMatch: 'RTX 5090',
      gpuNameNote: 'NInfer is compiled for the RTX 5090 (sm_120a) only; no RTX 5090 was detected.',
    },
    requirementNote: process.platform === 'win32'
      ? 'RTX 5090, NVIDIA driver with CUDA 13.1+ and WSL support, and a WSL2 distro in which nvidia-smi works.'
      : 'RTX 5090 and an NVIDIA driver with CUDA 13.1+ support.',
    protocol: 'openai-compat',
    request: {
      chatTemplateKwargs: false,
      effortLevels: ['low', 'medium', 'xhigh'],
      effortOff: 'none',
      dropFields: [
        'reasoning_budget', 'repeat_penalty', 'repeat_last_n', 'cache_prompt',
        'dry_multiplier', 'dry_base', 'dry_allowed_length', 'dry_penalty_last_n', 'dry_sequence_breakers',
        'mirostat', 'mirostat_tau', 'mirostat_eta', 'typical_p', 'tfs_z', 'n_probs', 'slot_id', 'id_slot',
      ],
    },
    launchStyle: 'ninfer',
    modelKinds: ['ninfer'],
    repo: { owner: 'Neroued', repo: 'ninfer' },
    manualSourceUrl: 'https://github.com/Neroued/ninfer',
    prebuilt: NinferCatalog.PREBUILT,
    source: NinferCatalog.SOURCE,
  };
}

module.exports = NinferCatalog;
