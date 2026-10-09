const HostIsa = require('./HostIsa');
const IkLlamaAssetPatterns = require('./IkLlamaAssetPatterns');

class IkLlamaCatalog {
  static BUILD_REPO = { owner: 'Thireus', repo: 'ik_llama.cpp' };
  static UPSTREAM_URL = 'https://github.com/ikawrakow/ik_llama.cpp';

  static UNSUPPORTED_FLAGS = ['--swa-full', '--cache-reuse', '--spec-draft-n-max', '--reasoning-preserve'];

  static EXTRA_ARGS = ['--no-warmup'];

  static NATIVE_QUANT_PATTERN = '\\biq\\d_k(?:ss|s|t)?(?:_r[48])?\\b|\\bi?q\\d(?:_[a-z0-9]+)*?_r[48]\\b';

  static MANUAL_SOURCE_NOTE =
    'To use your own build instead: cmake -B build -DGGML_CUDA=ON (or -DGGML_VULKAN=ON) && '
    + 'cmake --build build --config Release, then use Locate to register build/bin/llama-server.';

  static LLAMA_BIN_NAMES = {
    win32: ['llama-server.exe', 'llama-cli.exe', 'main.exe'],
    linux: ['llama-server', 'llama-cli', 'main'],
    darwin: ['llama-server', 'llama-cli', 'main'],
  };

  static FORK_BLURB =
    "ikawrakow's llama.cpp fork: its own IQ*_K / IQ*_KT quantization families, "
    + 'row-interleaved *_R4/*_R8 repacks, and CPU-side kernels tuned for large MoE models. ';

  static buildRuntimeEntries(opts = {}) {
    const platform = opts.platform || process.platform;
    const isa = opts.isa || HostIsa.detect({ platform }).isa;
    const common = IkLlamaCatalog._commonFields(isa);
    const rows = IkLlamaCatalog._rows(common, isa, platform);
    return rows.filter((r) => r.platforms.includes(platform));
  }

  static _commonFields(isa) {
    const C = IkLlamaCatalog;
    return {
      kind: 'inference',
      acquisition: 'github-release',
      repo: C.BUILD_REPO,
      binaryNames: C.LLAMA_BIN_NAMES,
      protocol: 'openai-compat',
      optional: true,
      manualSourceUrl: C.UPSTREAM_URL,
      manualSourceNote: C.MANUAL_SOURCE_NOTE,
      unsupportedFlags: C.UNSUPPORTED_FLAGS.slice(),
      skipFeatures: [],
      extraArgs: C.EXTRA_ARGS.slice(),
      nativeQuantPattern: C.NATIVE_QUANT_PATTERN,
      specDialect: 'ik',
      buildVariant: { isa, feed: `${C.BUILD_REPO.owner}/${C.BUILD_REPO.repo}` },
    };
  }

  static _rows(common, isa, platform) {
    const blurb = IkLlamaCatalog.FORK_BLURB;
    const isaNote = `Downloads Thireus's ${isa} build for this CPU.`;
    const patterns = (backend) => IkLlamaAssetPatterns.assetPatternsFor(backend, isa);
    const companions = (backend) => IkLlamaAssetPatterns.companionPatternsFor(backend, isa);
    return [
      {
        ...common,
        id: 'ik-llama-cuda13',
        name: 'ik_llama.cpp (CUDA 13)',
        description: `${blurb}NVIDIA GPU acceleration via CUDA 13 (native Blackwell kernels). ${isaNote}`,
        platforms: ['win32', 'linux'],
        assetPatterns: patterns('cuda13'),
        companionAssets: companions('cuda13'),
        requiresHw: { kind: 'nvidia-cuda', cudaMajor: 13 },
        requirementNote: 'Needs an NVIDIA GPU and a CUDA 13 driver (R580 or newer).',
      },
      {
        ...common,
        id: 'ik-llama-cuda12',
        name: 'ik_llama.cpp (CUDA 12)',
        description: `${blurb}NVIDIA GPU acceleration via CUDA 12. ${isaNote}`,
        platforms: ['win32', 'linux'],
        assetPatterns: patterns('cuda12'),
        companionAssets: companions('cuda12'),
        requiresHw: { kind: 'nvidia-cuda', cudaMajor: 12 },
        requirementNote: 'Needs an NVIDIA GPU and the CUDA 12 driver runtime.',
      },
      {
        ...common,
        id: 'ik-llama-vulkan',
        name: 'ik_llama.cpp (Vulkan)',
        description: `${blurb}Cross-vendor GPU acceleration via Vulkan; Linux builds only. ${isaNote}`,
        platforms: ['linux'],
        assetPatterns: patterns('vulkan'),
        requiresHw: { kind: 'gpu-any' },
        requirementNote: 'Needs a GPU with a Vulkan driver.',
      },
      {
        ...common,
        id: 'ik-llama-cpu',
        name: 'ik_llama.cpp (CPU)',
        description: `${blurb}Pure CPU inference, where the fork's MoE kernels matter most. ${platform === 'darwin' ? 'The Apple Silicon build uses Metal.' : isaNote}`,
        platforms: ['win32', 'linux', 'darwin'],
        assetPatterns: patterns('cpu'),
        requiresHw: null,
      },
    ];
  }
}

module.exports = IkLlamaCatalog;
